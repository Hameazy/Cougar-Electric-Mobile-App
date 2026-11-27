import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchPlaces } from '../../../customer/src/map/geocoding';
import { ServiceMap } from '../../../customer/src/parts/map/ServiceMap';
import {
  type MapMarker,
  type MapPoint,
} from '../../../customer/src/parts/map/ServiceMapTypes';
import { distanceInMiles } from '../../../customer/src/technicians/distance';
import {
  describeLocationProblem,
  useDeviceLocation,
} from '../../../customer/src/technicians/useDeviceLocation';
import { useRoadRoute } from '../../../customer/src/technicians/useDrivingInfo';
import {
  driveInfoFor,
  formatShortMinutes,
} from '../../../customer/src/technicians/travelEstimate';
import { openExternalMaps } from '../navigation/openExternalMaps';
import {
  DEMO_ASSIGNED_REQUEST,
  DEMO_TECHNICIAN_POSITION,
} from '../navigation/navigationDemoData';
import {
  formatServiceAddress,
  type AssignedServiceRequest,
} from '../serviceRequests/AssignedServiceRequestTypes';
import { readCoordinatePair } from '../serviceRequests/coordinateValidation';
import { useAssignedServiceRequests } from '../serviceRequests/useAssignedServiceRequests';

type GeocodeState = {
  key: string;
  status: 'ready' | 'failed';
  point?: MapPoint;
};

function normalizedParam(value: string | string[] | undefined): string | undefined {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.trim() || undefined;
}

function storedDestination(request: AssignedServiceRequest | undefined): MapPoint | undefined {
  return request
    ? readCoordinatePair(request.latitude, request.longitude)
    : undefined;
}

const ROUTE_REFRESH_DISTANCE_MILES = 0.25;

function useStableRouteOrigin(
  position: MapPoint | undefined,
  destinationKey: string,
): MapPoint | undefined {
  const [routeOrigin, setRouteOrigin] = useState<{
    destinationKey: string;
    point: MapPoint;
  }>();

  useEffect(() => {
    if (!position || !destinationKey) return;

    const update = setTimeout(() => {
      setRouteOrigin((current) => {
        if (
          !current
          || current.destinationKey !== destinationKey
          || distanceInMiles(current.point, position) >= ROUTE_REFRESH_DISTANCE_MILES
        ) {
          return { destinationKey, point: position };
        }
        return current;
      });
    }, 0);

    return () => clearTimeout(update);
  }, [destinationKey, position]);

  return routeOrigin?.destinationKey === destinationKey
    ? routeOrigin.point
    : position;
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function StateCard({
  title,
  message,
  busy = false,
}: {
  title: string;
  message: string;
  busy?: boolean;
}) {
  return (
    <View style={styles.stateCard}>
      {busy && <ActivityIndicator color={COLORS.yellow} />}
      <Text accessibilityRole="header" style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {!busy && (
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>BACK TO HOME</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function TechnicianNavigation() {
  const params = useLocalSearchParams<{
    requestId?: string | string[];
    demo?: string | string[];
  }>();
  const requestId = normalizedParam(params.requestId);
  const demoMode = __DEV__ && normalizedParam(params.demo) === '1';
  const assignments = useAssignedServiceRequests(requestId, !demoMode);
  const assignedRequest = assignments.requests.length === 1
    ? assignments.requests[0]
    : undefined;
  const request = demoMode ? DEMO_ASSIGNED_REQUEST : assignedRequest;
  const storedPoint = storedDestination(request);
  const fullAddress = request ? formatServiceAddress(request) : '';
  const geocodeKey = request && !storedPoint
    ? `${request.id}|${request.address}, ${request.city}, ${request.state} ${request.zip}`
    : '';
  const [geocode, setGeocode] = useState<GeocodeState | null>(null);
  const device = useDeviceLocation();
  const [linkError, setLinkError] = useState('');
  const [tilesFailed, setTilesFailed] = useState(false);
  const [clockTime, setClockTime] = useState(0);

  useEffect(() => {
    if (!geocodeKey || !request) return;

    const controller = new AbortController();
    searchPlaces(
      `${request.address}, ${request.city}, ${request.state} ${request.zip}`,
      undefined,
      controller.signal,
    )
      .then((places) => {
        if (controller.signal.aborted) return;
        const place = places[0];
        setGeocode(place
          ? {
              key: geocodeKey,
              status: 'ready',
              point: { latitude: place.latitude, longitude: place.longitude },
            }
          : { key: geocodeKey, status: 'failed' });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setGeocode({ key: geocodeKey, status: 'failed' });
        }
      });

    return () => controller.abort();
  }, [geocodeKey, request]);

  useEffect(() => {
    if (!demoMode && request && device.status === 'idle') void device.locate();
  }, [demoMode, device, request]);

  useEffect(() => {
    const updateClock = () => setClockTime(Date.now());
    const firstUpdate = setTimeout(updateClock, 0);
    const timer = setInterval(updateClock, 60_000);
    return () => {
      clearTimeout(firstUpdate);
      clearInterval(timer);
    };
  }, []);

  const geocodedPoint = geocode?.key === geocodeKey && geocode.status === 'ready'
    ? geocode.point
    : undefined;
  const destination = storedPoint ?? geocodedPoint;
  const technicianPosition = demoMode
    ? DEMO_TECHNICIAN_POSITION
    : device.position;
  const destinationKey = destination
    ? `${request?.id ?? ''}:${destination.latitude},${destination.longitude}`
    : '';
  const routeOrigin = useStableRouteOrigin(technicianPosition, destinationKey);
  const road = useRoadRoute(destination, routeOrigin);
  const drive = destination && technicianPosition && road.status !== 'loading'
    ? driveInfoFor(
        distanceInMiles(technicianPosition, destination),
        road.route ?? undefined,
      )
    : undefined;
  const arrival = drive && clockTime > 0
    ? new Date(clockTime + drive.minutes * 60_000).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : undefined;
  const markers = useMemo<MapMarker[]>(() => technicianPosition
    ? [{
        id: 'current-technician',
        kind: 'technician',
        label: demoMode ? 'DEMO' : 'YOU',
        title: demoMode ? 'DEMO DATA: technician starting location' : 'Your current location',
        latitude: technicianPosition.latitude,
        longitude: technicianPosition.longitude,
      }]
    : [], [demoMode, technicianPosition]);

  async function openMaps() {
    if (!request) return;
    setLinkError('');
    try {
      await openExternalMaps({
        address: fullAddress.replace('\n', ', '),
        latitude: destination?.latitude,
        longitude: destination?.longitude,
      });
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : 'External maps could not be opened.',
      );
    }
  }

  let content;
  if (!demoMode && assignments.loading) {
    content = <StateCard busy title="Loading assigned job" message="Checking your technician assignment…" />;
  } else if (!demoMode && !assignments.authenticated) {
    content = <StateCard title="Technician sign-in required" message="Sign in with your technician account before opening a customer's service address." />;
  } else if (!demoMode && assignments.errorMessage) {
    content = <StateCard title="Job unavailable" message={assignments.errorMessage} />;
  } else if (!demoMode && !requestId && assignments.requests.length > 1) {
    content = <StateCard title="Select a job first" message="You have multiple jobs ready for navigation. Open Jobs and select the customer you are heading to." />;
  } else if (!request) {
    content = <StateCard title="No assigned destination" message={requestId
      ? 'This request is not assigned to you or is no longer ready for navigation.'
      : 'You do not have a matched or en-route job to navigate to.'} />;
  } else {
    const locationProblem = demoMode
      ? ''
      : describeLocationProblem(device.status, Platform.OS === 'web');
    const geocoding = !storedPoint && !!geocodeKey && geocode?.key !== geocodeKey;
    const addressInvalid = !storedPoint && geocode?.key === geocodeKey && geocode.status === 'failed';

    content = (
      <ScrollView contentContainerStyle={styles.content}>
        {demoMode && (
          <View accessibilityRole="alert" style={styles.demoBanner}>
            <Text style={styles.demoBannerTitle}>DEMO DATA</Text>
            <Text style={styles.demoBannerText}>Local development preview only · No Firebase customer record is being displayed.</Text>
          </View>
        )}
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>{demoMode ? 'DEMO DATA · HEAD TO CUSTOMER' : 'HEAD TO CUSTOMER'}</Text>
          <Text accessibilityRole="header" style={styles.heading}>Your next stop</Text>
          <Text style={styles.subheading}>Follow the road route or open your preferred maps app.</Text>
        </View>

        {destination ? (
          <View style={styles.mapCard}>
            <ServiceMap
              center={destination}
              markers={markers}
              selectedId={technicianPosition ? 'current-technician' : undefined}
              routePath={road.route?.path}
              routeTo={technicianPosition}
              showServiceLocation
              theme={Platform.OS === 'web' ? 'navigation-light' : 'dark'}
              onTileStatus={(status) => setTilesFailed(status === 'failed')}
              style={styles.map}
            />
          </View>
        ) : (
          <View style={[styles.mapCard, styles.mapPlaceholder]}>
            {geocoding && <ActivityIndicator color={COLORS.yellow} />}
            <Text style={styles.mapPlaceholderTitle}>{geocoding ? 'Locating service address…' : 'Map unavailable'}</Text>
            <Text style={styles.mapPlaceholderText}>{addressInvalid
              ? 'The saved address could not be placed on the map. You can still try opening it in external maps.'
              : 'Waiting for the customer destination.'}</Text>
          </View>
        )}

        {tilesFailed && (
          <Text accessibilityRole="alert" style={styles.warning}>Map tiles did not load. Check your connection.</Text>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.cardLabel}>{demoMode ? 'DEMO DATA · SERVICE ADDRESS' : 'SERVICE ADDRESS'}</Text>
          <Text selectable style={styles.address}>{fullAddress}</Text>
          {demoMode && (
            <Text style={styles.demoNote}>DEMO DATA: Both map endpoints and the address are local sample values.</Text>
          )}
          {!storedPoint && destination && (
            <Text style={styles.note}>Map position estimated from the saved address.</Text>
          )}

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>DRIVE TIME</Text>
              <Text style={styles.metricValue}>{drive ? `${drive.source === 'estimate' ? '~' : ''}${formatShortMinutes(drive.minutes)}` : '—'}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>EST. ARRIVAL</Text>
              <Text style={[styles.metricValue, styles.arrival]}>{arrival ?? '—'}</Text>
            </View>
          </View>

          {road.status === 'loading' && (
            <Text accessibilityLiveRegion="polite" style={styles.note}>Calculating the road route…</Text>
          )}
          {road.status === 'failed' && drive && (
            <Text accessibilityRole="alert" style={styles.warning}>Road routing is unavailable. The displayed time is an estimate.</Text>
          )}
          {!demoMode && !!locationProblem && (
            <View style={styles.problemRow}>
              <Text accessibilityRole="alert" style={styles.warning}>{locationProblem}</Text>
              <Pressable accessibilityRole="button" onPress={() => void device.locate()} style={styles.retryButton}>
                <Text style={styles.retryText}>TRY LOCATION AGAIN</Text>
              </Pressable>
            </View>
          )}
          {!!linkError && <Text accessibilityRole="alert" style={styles.warning}>{linkError}</Text>}

          <Pressable accessibilityRole="button" onPress={() => void openMaps()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>OPEN IN MAPS</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topbarTitle}>{demoMode ? 'NAVIGATION · DEMO DATA' : 'NAVIGATION'}</Text>
        <View style={styles.backButton} />
      </View>
      {content}
    </SafeAreaView>
  );
}

const COLORS = {
  navy: '#07101F',
  panel: '#101827',
  line: '#293244',
  yellow: '#F5B900',
  blue: '#65ABFF',
  text: '#F8FAFC',
  muted: '#94A2B8',
  warning: '#FFB1A8',
};

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.navy, flex: 1 },
  topbar: { alignItems: 'center', borderBottomColor: COLORS.line, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 16 },
  topbarTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.8 },
  backButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  backText: { color: COLORS.text, fontSize: 38, lineHeight: 40 },
  content: { alignSelf: 'center', gap: 18, maxWidth: 720, padding: 22, paddingBottom: 40, width: '100%' },
  headingBlock: { gap: 7 },
  demoBanner: { backgroundColor: '#30270B', borderColor: COLORS.yellow, borderRadius: 14, borderWidth: 1, gap: 4, padding: 14 },
  demoBannerTitle: { color: COLORS.yellow, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  demoBannerText: { color: '#F7D96E', fontSize: 12, lineHeight: 18 },
  eyebrow: { color: COLORS.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  heading: { color: COLORS.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  subheading: { color: COLORS.muted, fontSize: 14, lineHeight: 21 },
  mapCard: { backgroundColor: '#0D1422', borderColor: COLORS.line, borderRadius: 22, borderWidth: 1, height: 390, overflow: 'hidden', position: 'relative' },
  map: { borderRadius: 22 },
  mapPlaceholder: { alignItems: 'center', gap: 10, justifyContent: 'center', padding: 28 },
  mapPlaceholderTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  mapPlaceholderText: { color: COLORS.muted, lineHeight: 21, maxWidth: 430, textAlign: 'center' },
  detailsCard: { backgroundColor: COLORS.panel, borderColor: COLORS.line, borderRadius: 22, borderWidth: 1, gap: 16, padding: 20 },
  cardLabel: { color: COLORS.blue, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  address: { color: COLORS.text, fontSize: 19, fontWeight: '800', lineHeight: 28 },
  note: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  demoNote: { color: '#F7D96E', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  metrics: { backgroundColor: COLORS.navy, borderRadius: 16, flexDirection: 'row', paddingVertical: 16 },
  metric: { flex: 1, gap: 7, paddingHorizontal: 16 },
  metricDivider: { backgroundColor: COLORS.line, width: 1 },
  metricLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  metricValue: { color: COLORS.text, fontSize: 23, fontWeight: '900', fontVariant: ['tabular-nums'] },
  arrival: { color: COLORS.yellow },
  warning: { color: COLORS.warning, fontSize: 13, lineHeight: 19 },
  problemRow: { gap: 10 },
  retryButton: { alignSelf: 'flex-start', borderColor: COLORS.blue, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  retryText: { color: COLORS.blue, fontSize: 11, fontWeight: '900' },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.yellow, borderRadius: 15, justifyContent: 'center', minHeight: 56, paddingHorizontal: 18 },
  primaryButtonText: { color: COLORS.navy, fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },
  secondaryButton: { borderColor: COLORS.yellow, borderRadius: 13, borderWidth: 1, marginTop: 8, paddingHorizontal: 18, paddingVertical: 14 },
  secondaryButtonText: { color: COLORS.yellow, fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.65 },
  stateCard: { alignItems: 'center', alignSelf: 'center', backgroundColor: COLORS.panel, borderColor: COLORS.line, borderRadius: 22, borderWidth: 1, gap: 14, margin: 24, maxWidth: 520, padding: 28, width: '90%' },
  stateTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  stateMessage: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
