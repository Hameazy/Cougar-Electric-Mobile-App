// CE-34: full screen map of the customer's service location and the
// electricians who are available near it. Opened from the map card on the
// Customer Dashboard.
//
// Where the data comes from:
// - service location: the customer's active service request (latitude/longitude
//   saved on the Emergency Location page), or a spot the customer picks with GPS
//   or the search bar.
// - electricians: Firestore "technicians" collection, live, through Ayyub's
//   useNearbyTechnicians hook (CE-35), already sorted nearest first. If Firestore
//   has nobody and EXPO_PUBLIC_DEMO_TECHNICIANS=true, labeled demo electricians
//   are shown instead (demoTechnicians.ts).
// - distance: straight line (distance.ts). Driving time: road routes from an OSRM
//   server (routing.ts), with a labeled rough estimate when that isn't available.
// - EV chargers: optional layer from the NREL public charger API.
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNearbyEvChargers } from '../evChargers/useNearbyEvChargers';
import type { EvCharger } from '../evChargers/evChargerRepository';
import { useAuthSession } from '../helpers/useAuthSession';
import { BackButton } from '../parts/BackButton';
import { DistanceRail } from '../parts/map/DistanceRail';
import { MapLegend, MapSideControls, ZoomControls } from '../parts/map/MapControls';
import { MapBottomSheet } from '../parts/map/MapBottomSheet';
import { MapSearchBar } from '../parts/map/MapSearchBar';
import { RequestStatusTracker } from '../parts/map/RequestStatusTracker';
import { ServiceMap } from '../parts/map/ServiceMap';
import {
  MAP_COLORS,
  type MapMarker,
  type MapPoint,
  type MapTheme,
  type ServiceMapHandle,
} from '../parts/map/ServiceMapTypes';
import {
  EmptyState,
  TechnicianDetails,
  TechnicianRow,
  TechnicianSkeletons,
} from '../parts/map/TechnicianCards';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import type { ActiveServiceRequest } from '../serviceRequests/ActiveServiceRequestTypes';
import { useActiveServiceRequests } from '../serviceRequests/useActiveServiceRequests';
import { DEMO_TECHNICIANS_ENABLED, makeDemoTechnicians } from '../technicians/demoTechnicians';
import { describePoint, searchPlaces } from '../technicians/geocoding';
import type { PlaceMatch } from '../technicians/placeParsing';
import {
  filterTechnicians,
  initialsOf,
  TECHNICIAN_FILTERS,
  toggleFilter,
  toMapTechnician,
  type MapTechnician,
  type TechnicianFilter,
} from '../technicians/technicianFilters';
import {
  driveInfoFor,
  formatMiles,
  formatShortMinutes,
  type DriveInfo,
} from '../technicians/travelEstimate';
import { describeLocationProblem, useDeviceLocation } from '../technicians/useDeviceLocation';
import { useDriveTimes, useRoadRoute } from '../technicians/useDrivingInfo';
import { useNearbyTechnicians } from '../technicians/useNearbyTechnicians';
import { styles } from '../styles/PageStyle';

const RINGS = [2, 5, 10];
const CHARGER_PREFIX = 'ev-';
const NO_CHARGERS: EvCharger[] = [];
// Only used to draw a map behind the "where are you?" card before a location is picked.
const DEFAULT_CENTER: MapPoint = { latitude: 38.5816, longitude: -121.4944 };
// screens at least this wide get the electrician list as a side panel
const WIDE_SCREEN = 900;
const PANEL_WIDTH = 420;
// room kept free on the right so pins don't hide under the round buttons
const SIDE_CONTROLS_WIDTH = 64;

type ServiceSpot = MapPoint & { label: string; source: 'request' | 'gps' | 'search' };

function requestAddress(request: ActiveServiceRequest): string {
  return [request.address, request.city].filter(Boolean).join(', ') || 'Your service address';
}

function chargerPorts(charger: EvCharger): string {
  const parts = [];
  if (charger.fastPorts) parts.push(`${charger.fastPorts} fast`);
  if (charger.level2Ports) parts.push(`${charger.level2Ports} Level 2`);
  return parts.length ? `${parts.join(' and ')} ${charger.fastPorts + charger.level2Ports === 1 ? 'port' : 'ports'}` : 'Ports not listed';
}

function captionFor(spot: ServiceSpot): string {
  if (spot.source === 'request') return 'Showing electricians near your service address';
  if (spot.source === 'gps') return 'Showing electricians near you';
  return 'Showing electricians near this address';
}

// ---------- pieces of the sheet ----------

function LocationPrompt({
  locating,
  problem,
  canOpenSettings,
  onLocate,
}: {
  locating: boolean;
  problem: string;
  canOpenSettings: boolean;
  onLocate: () => void;
}) {
  return (
    <View style={pageStyles.prompt}>
      <Text accessibilityRole="header" style={pageStyles.promptTitle}>Where do you need an electrician?</Text>
      <Text style={pageStyles.promptBody}>
        Share your location or search an address to see who is nearby and how long they would take to get there.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={locating}
        onPress={onLocate}
        style={({ pressed }) => [styles.button, pageStyles.promptButton, pressed && styles.buttonPressed]}
      >
        {locating ? <ActivityIndicator color={MAP_COLORS.night} /> : <Text style={styles.buttonText}>Use my current location</Text>}
      </Pressable>
      {!!problem && (
        <View style={pageStyles.problemBox}>
          <Text accessibilityRole="alert" style={pageStyles.problemText}>{problem}</Text>
          {canOpenSettings && (
            <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}>
              <Text style={styles.textLink}>Open Settings</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function ChargerDetails({ charger, onClose }: { charger: EvCharger; onClose: () => void }) {
  return (
    <View style={pageStyles.chargerCard}>
      <View style={pageStyles.chargerTop}>
        <View style={pageStyles.chargerBadge}><Text style={pageStyles.chargerBadgeText}>EV</Text></View>
        <View style={pageStyles.chargerCopy}>
          <Text style={pageStyles.chargerName} numberOfLines={2}>{charger.name}</Text>
          {!!charger.address && <Text style={pageStyles.chargerMeta} numberOfLines={1}>{charger.address}</Text>}
        </View>
        <Pressable accessibilityLabel="Close details" accessibilityRole="button" hitSlop={10} onPress={onClose} style={pageStyles.chargerClose}>
          <Text style={pageStyles.chargerCloseText}>✕</Text>
        </Pressable>
      </View>
      <View style={pageStyles.chargerStats}>
        <View style={pageStyles.chargerStat}>
          <Text style={pageStyles.chargerStatValue}>{formatMiles(charger.distanceMiles)}</Text>
          <Text style={pageStyles.chargerStatLabel}>Straight line from your address</Text>
        </View>
        <View style={pageStyles.chargerStat}>
          <Text style={pageStyles.chargerStatValue}>{chargerPorts(charger)}</Text>
          <Text style={pageStyles.chargerStatLabel}>{charger.network ?? 'Public charger'}</Text>
        </View>
      </View>
      {!!charger.hours && <Text style={pageStyles.chargerMeta}>Hours: {charger.hours}</Text>}
    </View>
  );
}

// ---------- the page ----------

export default function NearbyTechnicianMap() {
  // Changing this number rebuilds the whole screen, which is how "Try again" works.
  const [attempt, setAttempt] = useState(0);
  return <NearbyTechnicianMapScreen key={attempt} onRetry={() => setAttempt((count) => count + 1)} />;
}

function NearbyTechnicianMapScreen({ onRetry }: { onRetry: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_SCREEN;
  const { user, loading: authLoading } = useAuthSession();
  const { requests, loading: loadingRequests } = useActiveServiceRequests(user?.id);
  const { resetDraft } = useServiceRequestDraft();
  const mapHandle = useRef<ServiceMapHandle>(null);

  // ----- where we are looking -----
  // only requests with real, usable coordinates (a saved NaN would crash the map)
  const activeRequest = requests.find((request) => Number.isFinite(request.latitude) && Number.isFinite(request.longitude));
  const requestLatitude = activeRequest?.latitude;
  const requestLongitude = activeRequest?.longitude;
  const requestLabel = activeRequest ? requestAddress(activeRequest) : '';
  const requestSpot = useMemo<ServiceSpot | null>(
    () => (requestLatitude !== undefined && requestLongitude !== undefined
      ? { latitude: requestLatitude, longitude: requestLongitude, label: requestLabel, source: 'request' }
      : null),
    [requestLatitude, requestLongitude, requestLabel],
  );
  // a spot the customer chose (GPS or search) wins over the request address
  const [pickedSpot, setPickedSpot] = useState<ServiceSpot | null>(null);
  const spot = pickedSpot ?? requestSpot;
  const center = useMemo<MapPoint>(
    () => (spot ? { latitude: spot.latitude, longitude: spot.longitude } : DEFAULT_CENTER),
    [spot],
  );

  // ----- electricians -----
  const nearby = useNearbyTechnicians(spot ?? undefined);
  const realTechnicians = useMemo(() => nearby.technicians.map(toMapTechnician), [nearby.technicians]);
  const demoTechnicians = useMemo(
    () => (DEMO_TECHNICIANS_ENABLED && spot && !nearby.loading && realTechnicians.length === 0
      ? makeDemoTechnicians(spot)
      : []),
    [spot, nearby.loading, realTechnicians.length],
  );
  const showingDemo = demoTechnicians.length > 0;
  const everyone = showingDemo ? demoTechnicians : realTechnicians;

  const [filters, setFilters] = useState<TechnicianFilter[]>([]);
  const technicians = useMemo(() => filterTechnicians(everyone, filters), [everyone, filters]);
  const closest = technicians[0];

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selectedTechnician = technicians.find((technician) => technician.id === selectedId);

  // ----- real driving data -----
  const driveTimes = useDriveTimes(spot ?? undefined, technicians);
  const road = useRoadRoute(spot ?? undefined, selectedTechnician);

  function driveFor(technician: MapTechnician): DriveInfo {
    if (technician.id === selectedId && road.route) {
      return driveInfoFor(technician.distanceMiles, { minutes: road.route.minutes, roadMiles: road.route.roadMiles });
    }
    return driveInfoFor(technician.distanceMiles, driveTimes.times[technician.id]);
  }

  // ----- EV chargers -----
  const [showChargers, setShowChargers] = useState(false);
  const ev = useNearbyEvChargers(spot, showChargers);
  const chargers = showChargers ? ev.chargers : NO_CHARGERS;
  const selectedCharger = chargers.find((charger) => `${CHARGER_PREFIX}${charger.id}` === selectedId);

  // ----- GPS -----
  const device = useDeviceLocation();
  const [showLocationProblem, setShowLocationProblem] = useState(false);
  const locationProblem = showLocationProblem ? describeLocationProblem(device.status, Platform.OS === 'web') : '';

  // ----- search -----
  const [draft, setDraft] = useState<string | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [matches, setMatches] = useState<PlaceMatch[]>([]);
  const searchController = useRef<AbortController | null>(null);
  useEffect(() => () => searchController.current?.abort(), []);

  // ----- layout and looks -----
  const [theme, setTheme] = useState<MapTheme>('dark');
  const [legendOpen, setLegendOpen] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageHeight, setPageHeight] = useState(0);
  const [peekHeight, setPeekHeight] = useState(240);
  const onPeekHeightChange = useCallback((height: number) => setPeekHeight(height), []);

  const markers = useMemo<MapMarker[]>(() => [
    ...technicians.map((technician): MapMarker => ({
      id: technician.id,
      kind: 'technician',
      latitude: technician.latitude,
      longitude: technician.longitude,
      label: initialsOf(technician.name),
      title: `${technician.name}, ${formatMiles(technician.distanceMiles)} away`,
      tone: technician.availability,
    })),
    ...chargers.map((charger): MapMarker => ({
      id: `${CHARGER_PREFIX}${charger.id}`,
      kind: 'charger',
      latitude: charger.latitude,
      longitude: charger.longitude,
      label: 'EV',
      title: `EV charger: ${charger.name}`,
    })),
  ], [technicians, chargers]);

  // ----- actions -----

  // Picking someone shows their card in the short sheet and keeps the map
  // (and the route line) visible above it.
  function select(id: string) {
    setSelectedId(id);
    setSheetOpen(false);
    setMatches([]);
    setLegendOpen(false);
  }

  function clearSelection() {
    setSelectedId(undefined);
  }

  function pickSpot(next: ServiceSpot) {
    setPickedSpot(next);
    setDraft(null);
    setMatches([]);
    setSearchMessage('');
    setSelectedId(undefined);
  }

  async function submitSearch() {
    const text = (draft ?? '').trim();
    if (!text) {
      setSearchMessage('Type a street address, city or ZIP code.');
      return;
    }

    Keyboard.dismiss();
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setSearchBusy(true);
    setSearchMessage('');
    setMatches([]);
    setShowLocationProblem(false);

    try {
      const found = await searchPlaces(text, controller.signal);
      if (controller.signal.aborted) return;
      if (found.length === 0) {
        setSearchMessage('No match for that address. Check the spelling or add the city.');
      } else if (found.length === 1) {
        pickSpot({ ...found[0], source: 'search' });
      } else {
        setMatches(found);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setSearchMessage(error instanceof Error && error.message.startsWith('Too many')
        ? error.message
        : 'Address search is not working right now. Check your connection and try again.');
    } finally {
      if (searchController.current === controller) setSearchBusy(false);
    }
  }

  async function findMe() {
    setShowLocationProblem(true);
    setSearchMessage('');
    setMatches([]);
    const position = await device.locate();
    if (!position) return;
    setShowLocationProblem(false);

    // With an active request we keep measuring from the service address and just
    // show where the customer is. Otherwise "near me" becomes the search spot.
    if (requestSpot && !pickedSpot) {
      mapHandle.current?.panTo(position);
      return;
    }
    const here: ServiceSpot = { latitude: position.latitude, longitude: position.longitude, label: 'Your current location', source: 'gps' };
    pickSpot(here);
    void describePoint(here).then((street) => {
      if (!street) return;
      setPickedSpot((current) => (current && current.source === 'gps' && current.latitude === here.latitude ? { ...current, label: street } : current));
    });
  }

  function primaryAction() {
    if (activeRequest) {
      router.push({ pathname: '/service-request/[requestId]', params: { requestId: activeRequest.id } });
      return;
    }
    resetDraft();
    router.push('/choose-electrical-issue');
  }

  const topBarHeight = insets.top + 108;
  const expandedHeight = Math.max(320, Math.min(pageHeight - topBarHeight - 12, pageHeight * 0.8));

  // ----- states before the map can show -----

  if (authLoading || (user && loadingRequests)) {
    return (
      <SafeAreaView style={[styles.safe, pageStyles.center]}>
        <ActivityIndicator color={MAP_COLORS.volt} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={pageStyles.plainHeader}>
          <BackButton accessibilityLabel="Back to Home" fallback="/dashboard" textStyle={styles.textLink}>← Back</BackButton>
        </View>
        <View style={pageStyles.signedOut}>
          <Text accessibilityRole="header" style={pageStyles.promptTitle}>Sign in to see the map</Text>
          <Text style={pageStyles.promptBody}>Electrician locations are only shown to signed-in customers.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.button, pageStyles.promptButton, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ----- sheet header (always visible) -----

  const filtering = filters.length > 0;
  const loadingTechnicians = !!spot && nearby.loading;
  const loadError = !showingDemo ? nearby.errorMessage : '';

  const headline = !spot
    ? ''
    : loadingTechnicians
      ? 'Looking for electricians…'
      : loadError
        ? 'We could not load electricians'
        : technicians.length === 0
          ? filtering ? 'No electricians match these filters' : 'No electricians available right now'
          : `${technicians.length} ${technicians.length === 1 ? 'electrician' : 'electricians'} ${filtering ? 'match' : 'nearby'}`;

  const closestDrive = closest ? driveFor(closest) : undefined;
  const subline = loadError
    ? loadError
    : closest && closestDrive
      ? `Closest is ${closest.name.split(' ')[0]}, ${closestDrive.source === 'road' ? '' : 'about '}${formatShortMinutes(closestDrive.minutes)} away`
      : loadingTechnicians
        ? 'Checking who is online…'
        : filtering
          ? 'Try turning a filter off to see more people.'
          : 'You can still send a request and we will assign the next free electrician.';

  const selectionCard = selectedTechnician ? (
    <TechnicianDetails
      technician={selectedTechnician}
      drive={driveFor(selectedTechnician)}
      routeStatus={road.status}
      hasActiveRequest={!!activeRequest}
      compact={!wide}
      onPrimary={primaryAction}
      onClose={clearSelection}
    />
  ) : selectedCharger ? (
    <ChargerDetails charger={selectedCharger} onClose={clearSelection} />
  ) : null;

  const chipItems = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: !filtering }}
        onPress={() => setFilters([])}
        style={[pageStyles.chip, !filtering && pageStyles.chipActive]}
      >
        <Text style={[pageStyles.chipText, !filtering && pageStyles.chipTextActive]}>All</Text>
      </Pressable>
      {TECHNICIAN_FILTERS.map((option) => {
        const active = filters.includes(option.id);
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setFilters((current) => toggleFilter(current, option.id))}
            style={[pageStyles.chip, active && pageStyles.chipActive]}
          >
            <Text style={[pageStyles.chipText, active && pageStyles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: showChargers }}
        onPress={() => {
          setShowChargers((on) => !on);
          if (selectedId?.startsWith(CHARGER_PREFIX)) clearSelection();
        }}
        style={[pageStyles.chip, pageStyles.evChip, showChargers && pageStyles.evChipActive]}
      >
        <Text style={[pageStyles.chipText, showChargers && pageStyles.evChipTextActive]}>EV chargers</Text>
      </Pressable>
    </>
  );

  // phones: one row you can swipe sideways. Laptops: the chips wrap onto two rows.
  const chips = wide ? (
    <View style={[pageStyles.chips, pageStyles.chipsWrap]}>{chipItems}</View>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pageStyles.chips}>
      {chipItems}
    </ScrollView>
  );

  const sheetHeader = !spot ? (
    <View style={pageStyles.sheetHeader}>
      <LocationPrompt
        locating={device.status === 'locating'}
        problem={locationProblem}
        canOpenSettings={Platform.OS !== 'web' && (device.status === 'blocked' || device.status === 'unavailable')}
        onLocate={() => void findMe()}
      />
    </View>
  ) : selectionCard ? (
    <View style={pageStyles.sheetHeader}>{selectionCard}</View>
  ) : (
    <View style={pageStyles.sheetHeader}>
      <View style={pageStyles.headlineRow}>
        <View style={pageStyles.headlineCopy}>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={pageStyles.headline}>{headline}</Text>
          <Text
            accessibilityRole={loadError ? 'alert' : undefined}
            style={[pageStyles.subline, !!loadError && pageStyles.errorText]}
            numberOfLines={2}
          >
            {subline}
          </Text>
        </View>
      </View>
      {chips}
    </View>
  );

  const topInsetForMap = wide ? insets.top + 12 : topBarHeight;
  const leftInsetForMap = wide ? PANEL_WIDTH + 32 : 0;
  const sideColumnTop = wide ? insets.top + 10 : topBarHeight + 8;
  const zoomBottom = wide ? 24 : peekHeight + 14;

  return (
    <View style={pageStyles.page} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
      <ServiceMap
        key={mapKey}
        ref={mapHandle}
        center={center}
        markers={markers}
        selectedId={selectedTechnician || selectedCharger ? selectedId : undefined}
        onSelectMarker={select}
        onPressMap={() => {
          clearSelection();
          setLegendOpen(false);
          setMatches([]);
        }}
        routePath={selectedTechnician ? road.route?.path : undefined}
        routeTo={selectedTechnician}
        userLocation={device.position}
        showServiceLocation={!!spot}
        rings={spot ? RINGS : undefined}
        bottomInset={wide || !spot ? 0 : peekHeight}
        topInset={topInsetForMap}
        leftInset={spot ? leftInsetForMap : 0}
        rightInset={SIDE_CONTROLS_WIDTH}
        theme={theme}
        onTileStatus={(status) => setTilesFailed(status === 'failed')}
      />

      {/* search bar floats over the map */}
      <View
        style={[
          pageStyles.topBar,
          { paddingTop: insets.top + 10 },
          wide && { right: undefined, width: PANEL_WIDTH + 32 },
        ]}
        pointerEvents="box-none"
      >
        <MapSearchBar
          leading={<BackButton accessibilityLabel="Back to Home" fallback="/dashboard" textStyle={pageStyles.backText}>‹</BackButton>}
          value={draft ?? spot?.label ?? ''}
          onChangeText={(text) => {
            setDraft(text);
            setSearchMessage('');
          }}
          onSubmit={() => void submitSearch()}
          onClear={() => {
            setDraft('');
            setMatches([]);
            setSearchMessage('');
          }}
          busy={searchBusy}
          message={searchMessage || (spot ? locationProblem : '')}
          messageInset={wide ? 0 : SIDE_CONTROLS_WIDTH - 2}
          matches={matches}
          onPickMatch={(match) => pickSpot({ ...match, source: 'search' })}
          caption={spot ? captionFor(spot) : undefined}
          onResetToRequest={requestSpot && pickedSpot ? () => pickSpot(requestSpot) : undefined}
        />
      </View>

      {tilesFailed && (
        <View accessibilityRole="alert" style={[pageStyles.tileBanner, { left: wide ? leftInsetForMap : 14, right: 76, top: sideColumnTop }]}>
          <Text style={pageStyles.tileBannerText}>The street map didn’t load. Check your connection.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setTilesFailed(false);
              setMapKey((key) => key + 1);
            }}
          >
            <Text style={pageStyles.tileBannerLink}>Retry</Text>
          </Pressable>
        </View>
      )}

      <View style={[pageStyles.sideColumn, { top: sideColumnTop }]} pointerEvents="box-none">
        <MapSideControls
          locating={device.status === 'locating'}
          locateActive={!!device.position}
          onLocate={() => void findMe()}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'streets' : 'dark'))}
          legendOpen={legendOpen}
          onToggleLegend={() => setLegendOpen((open) => !open)}
        />
      </View>

      {legendOpen && (
        <View style={[pageStyles.legendArea, { top: sideColumnTop }]} pointerEvents="box-none">
          <MapLegend showChargers={showChargers} />
        </View>
      )}

      <View style={[pageStyles.zoomArea, { bottom: zoomBottom }]} pointerEvents="box-none">
        {spot && closest && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom out to show everyone"
            onPress={() => {
              clearSelection();
              mapHandle.current?.showAll();
            }}
            style={({ pressed }) => [pageStyles.showAll, pressed && styles.buttonPressed]}
          >
            <Text style={pageStyles.showAllText}>Show all</Text>
          </Pressable>
        )}
        <ZoomControls onZoomIn={() => mapHandle.current?.zoomBy(1)} onZoomOut={() => mapHandle.current?.zoomBy(-1)} />
      </View>

      {pageHeight > 0 && (
        <MapBottomSheet
          variant={wide ? 'panel' : 'sheet'}
          panelTop={topBarHeight}
          expanded={sheetOpen}
          onExpandedChange={setSheetOpen}
          expandedHeight={expandedHeight}
          bottomPadding={insets.bottom}
          header={sheetHeader}
          onPeekHeightChange={onPeekHeightChange}
        >
          {spot && activeRequest && <RequestStatusTracker request={activeRequest} />}


          {spot && technicians.length > 0 && (
            <DistanceRail technicians={technicians} selectedId={selectedId} onSelect={select} />
          )}

          {spot && loadingTechnicians && <TechnicianSkeletons />}

          {spot && !loadingTechnicians && loadError !== '' && (
            <EmptyState title="Electricians didn’t load" body={loadError} actionLabel="Try again" onAction={onRetry} />
          )}

          {spot && !loadingTechnicians && !loadError && technicians.length === 0 && (
            <EmptyState
              title={filtering ? 'No one matches those filters' : 'No electricians are online right now'}
              body={filtering
                ? 'Try a bigger distance or turn off a filter.'
                : 'New electricians go online all the time. You can send a request now and we will assign the next free one.'}
              actionLabel={filtering ? 'Clear filters' : undefined}
              onAction={filtering ? () => setFilters([]) : undefined}
            />
          )}

          {technicians.map((technician) => (
            <TechnicianRow
              key={technician.id}
              technician={technician}
              drive={driveFor(technician)}
              selected={technician.id === selectedId}
              onPress={() => select(technician.id)}
            />
          ))}

          {spot && !activeRequest && !loadingTechnicians && (
            <Pressable accessibilityRole="button" onPress={primaryAction} style={({ pressed }) => [pageStyles.primary, pressed && styles.buttonPressed]}>
              <Text style={pageStyles.primaryText}>Request an electrician</Text>
            </Pressable>
          )}

          {showChargers && spot && (
            <View style={pageStyles.chargerSection}>
              <Text style={pageStyles.sectionTitle}>EV chargers within 10 mi</Text>
              {ev.loading && <ActivityIndicator color={MAP_COLORS.charger} />}
              {!!ev.errorMessage && (
                <View style={pageStyles.chargerError}>
                  <Text accessibilityRole="alert" style={pageStyles.errorText}>{ev.errorMessage}</Text>
                  <Pressable accessibilityRole="button" onPress={ev.retry}><Text style={styles.textLink}>Try again</Text></Pressable>
                </View>
              )}
              {!ev.loading && !ev.errorMessage && ev.chargers.length === 0 && (
                <Text style={pageStyles.subline}>No public chargers found within 10 miles.</Text>
              )}
              {ev.chargers.map((charger) => (
                <Pressable
                  key={charger.id}
                  accessibilityRole="button"
                  onPress={() => select(`${CHARGER_PREFIX}${charger.id}`)}
                  style={({ pressed }) => [pageStyles.chargerRow, pressed && styles.buttonPressed]}
                >
                  <View style={pageStyles.chargerBadge}><Text style={pageStyles.chargerBadgeText}>EV</Text></View>
                  <View style={pageStyles.chargerCopy}>
                    <Text style={pageStyles.chargerName} numberOfLines={1}>{charger.name}</Text>
                    <Text style={pageStyles.chargerMeta} numberOfLines={1}>{chargerPorts(charger)}</Text>
                  </View>
                  <Text style={pageStyles.chargerDistance}>{formatMiles(charger.distanceMiles)}</Text>
                </Pressable>
              ))}
              <Text style={pageStyles.footnote}>Charger data: U.S. Department of Energy (NREL)</Text>
            </View>
          )}

          {spot && (
            <Text style={pageStyles.footnote}>
              Distances are straight-line and ignore roads. Drive times use road routes when available, and show “~” when they are only an estimate.
            </Text>
          )}
        </MapBottomSheet>
      )}
    </View>
  );
}

const FLOAT_BACKGROUND = 'rgba(17, 23, 34, 0.94)';

const pageStyles = StyleSheet.create({
  page: { backgroundColor: MAP_COLORS.land, flex: 1, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  plainHeader: { paddingHorizontal: 22, paddingTop: 6 },
  signedOut: { alignItems: 'center', alignSelf: 'center', gap: 14, maxWidth: 480, padding: 24, width: '100%' },

  // location prompt (before a spot is picked)
  prompt: { gap: 12, paddingBottom: 6 },
  promptTitle: { color: MAP_COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  promptBody: { color: '#AAB5C7', fontSize: 15, lineHeight: 22 },
  promptButton: { alignSelf: 'stretch', marginTop: 4 },
  problemBox: { backgroundColor: '#301B20', borderColor: '#5A2C33', borderRadius: 12, borderWidth: 1, gap: 4, padding: 12 },
  problemText: { color: '#FFB1A8', fontSize: 14, lineHeight: 20 },

  // floating controls
  topBar: { left: 0, paddingHorizontal: 14, position: 'absolute', right: 0, top: 0, zIndex: 8 },
  backText: { color: MAP_COLORS.text, fontSize: 32, lineHeight: 34, marginTop: -3, paddingHorizontal: 14 },
  sideColumn: { position: 'absolute', right: 14, zIndex: 4 },
  legendArea: { position: 'absolute', right: 74, width: 230, zIndex: 4 },
  zoomArea: { alignItems: 'flex-end', gap: 10, position: 'absolute', right: 14, zIndex: 4 },
  showAll: { backgroundColor: FLOAT_BACKGROUND, borderColor: MAP_COLORS.line, borderRadius: 18, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 14 },
  showAllText: { color: MAP_COLORS.text, fontSize: 13, fontWeight: '800' },
  tileBanner: { alignItems: 'center', backgroundColor: '#301B20', borderColor: '#5A2C33', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', maxWidth: 420, padding: 12, position: 'absolute', zIndex: 4 },
  tileBannerText: { color: '#FFB1A8', flexShrink: 1, fontSize: 13, lineHeight: 18 },
  tileBannerLink: { color: MAP_COLORS.volt, fontSize: 13, fontWeight: '800' },

  // sheet header
  sheetHeader: { gap: 14, paddingBottom: 14, paddingHorizontal: 18, userSelect: 'none' },
  headlineRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  headlineCopy: { flex: 1, minWidth: 0 },
  headline: { color: MAP_COLORS.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  subline: { color: '#AAB5C7', fontSize: 14, lineHeight: 20, marginTop: 3 },
  errorText: { color: '#FFB1A8' },
  chips: { gap: 8, paddingRight: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingRight: 0 },
  chip: { borderColor: MAP_COLORS.line, borderRadius: 20, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 16 },
  chipActive: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.volt },
  chipText: { color: '#D7DFEC', fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: MAP_COLORS.night },
  evChip: { borderStyle: 'dashed' },
  evChipActive: { backgroundColor: '#241B4A', borderColor: MAP_COLORS.charger, borderStyle: 'solid' },
  evChipTextActive: { color: '#D6CBFF' },

  // sheet body
  primary: { alignItems: 'center', backgroundColor: MAP_COLORS.volt, borderRadius: 14, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  primaryText: { color: MAP_COLORS.night, fontSize: 16, fontWeight: '800' },
  chargerSection: { gap: 10, marginTop: 6 },
  sectionTitle: { color: '#D6CBFF', fontSize: 14, fontWeight: '800' },
  chargerError: { backgroundColor: '#301B20', borderRadius: 12, padding: 12 },
  chargerRow: { alignItems: 'center', backgroundColor: MAP_COLORS.panel, borderColor: '#2A3240', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10 },
  chargerBadge: { alignItems: 'center', backgroundColor: MAP_COLORS.charger, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  chargerBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  chargerCopy: { flex: 1, gap: 3 },
  chargerName: { color: MAP_COLORS.text, fontSize: 15, fontWeight: '700' },
  chargerMeta: { color: '#AAB5C7', fontSize: 13 },
  chargerDistance: { color: MAP_COLORS.text, fontSize: 15, fontVariant: ['tabular-nums'], fontWeight: '800' },
  chargerCard: { backgroundColor: MAP_COLORS.panel, borderColor: MAP_COLORS.charger, borderRadius: 20, borderWidth: 1, gap: 14, padding: 16 },
  chargerTop: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  chargerClose: { alignItems: 'center', backgroundColor: '#1B2638', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  chargerCloseText: { color: '#C7D2E3', fontSize: 14, fontWeight: '800' },
  chargerStats: { flexDirection: 'row', gap: 10 },
  chargerStat: { backgroundColor: MAP_COLORS.night, borderRadius: 14, flex: 1, gap: 4, padding: 12 },
  chargerStatValue: { color: MAP_COLORS.text, fontSize: 17, fontVariant: ['tabular-nums'], fontWeight: '800' },
  chargerStatLabel: { color: MAP_COLORS.muted, fontSize: 12, lineHeight: 16 },
  footnote: { color: '#7D899D', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
