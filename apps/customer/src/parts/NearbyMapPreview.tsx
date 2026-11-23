// CE-34: the live mini map card on the Customer Dashboard.
//
// It's a still preview (no dragging) so it doesn't fight with the page scrolling.
// Tapping anywhere opens the full map at /technician-map.
//
// Where the map is centered, best first:
//   1. the service address from the customer's active request
//   2. the device location, but only if permission was already given
//      (the dashboard never pops a permission prompt on its own)
//   3. the Sacramento area, clearly labeled as a general area
//
// Electricians are the real ones from Firestore. If there are none and
// EXPO_PUBLIC_DEMO_TECHNICIANS=true, made-up demo electricians are shown and
// the card says "Demo" in two places, same rule as the full map.
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RankedTechnician } from '../technicians/AvailableTechnicianTypes';
import { DEMO_TECHNICIANS_ENABLED, makeDemoTechnicians } from '../technicians/demoTechnicians';
import { firstNameOf, formatMiles, formatRatingShort, initialsOf } from '../technicians/technicianDisplay';
import type { MapTechnician } from '../technicians/technicianFilters';
import { estimateDriveMinutes, formatShortMinutes } from '../technicians/travelEstimate';
import { useNearbyTechnicians } from '../technicians/useNearbyTechnicians';
import { ServiceMap } from './map/ServiceMap';
import { MAP_COLORS, type MapMarker, type MapPoint, type TileStatus } from './map/ServiceMapTypes';

// Same default spot the full map uses before anything is picked.
const FALLBACK_CENTER: MapPoint = { latitude: 38.5816, longitude: -121.4944 };
// "nearby" in the counter means within this many miles
const NEARBY_MILES = 10;
// more pins than this turns the little map into confetti
const PREVIEW_PIN_LIMIT = 6;
const AVATAR_LIMIT = 3;
// how long to wait for an already-allowed GPS fix before giving up quietly
const QUIET_FIX_TIMEOUT_MS = 8000;

type CenterSource = 'service' | 'device' | 'fallback';

// Finds the device location without ever asking for permission. If the
// customer already allowed it (on the full map, for example) we use it.
function useQuietDeviceLocation(skip: boolean): MapPoint | undefined {
  const [point, setPoint] = useState<MapPoint | undefined>();

  useEffect(() => {
    if (skip) return;
    let cancelled = false;

    (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (cancelled || permission.status !== Location.PermissionStatus.GRANTED) return;

        // a recent cached fix is instant; otherwise ask for a rough one (city-block accuracy is plenty here)
        const cached = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
        const fix = cached ?? await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), QUIET_FIX_TIMEOUT_MS)),
        ]);
        if (!cancelled && fix) setPoint({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
      } catch {
        // no location is fine, the card falls back to the general area
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skip]);

  return skip ? undefined : point;
}

// The soft green "live" dot in the counter pill.
function LiveDot({ active }: { active: boolean }) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (mounted) setReduceMotion(enabled); })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!active || reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduceMotion, pulse]);

  return (
    <View style={previewStyles.liveDotBox}>
      {active && !reduceMotion && (
        <Animated.View
          style={[
            previewStyles.liveHalo,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
            },
          ]}
        />
      )}
      <View style={[previewStyles.liveDot, !active && previewStyles.liveDotIdle]} />
    </View>
  );
}

function AvatarStack({ technicians }: { technicians: MapTechnician[] }) {
  if (technicians.length === 0) return null;
  const shown = technicians.slice(0, AVATAR_LIMIT);
  const extra = technicians.length - shown.length;

  return (
    <View style={previewStyles.avatars} accessible={false}>
      {shown.map((technician, index) => (
        <View key={technician.id} style={[previewStyles.avatar, index > 0 && previewStyles.avatarOverlap, { zIndex: AVATAR_LIMIT - index }]}>
          <Text style={previewStyles.avatarText}>{initialsOf(technician.name)}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[previewStyles.avatar, previewStyles.avatarOverlap, previewStyles.avatarMore]}>
          <Text style={previewStyles.avatarMoreText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

export function NearbyMapPreview({
  serviceLocation,
  serviceLabel,
  technicians: serviceTechnicians,
  loading: serviceLoading,
}: {
  // the active request's address, if there is one
  serviceLocation?: MapPoint;
  // short readable address for the location chip, e.g. "6000 J St"
  serviceLabel?: string;
  // the dashboard already subscribes for the service address, so it passes its results in
  technicians: RankedTechnician[];
  loading: boolean;
}) {
  const devicePoint = useQuietDeviceLocation(!!serviceLocation);
  const source: CenterSource = serviceLocation ? 'service' : devicePoint ? 'device' : 'fallback';
  const center = serviceLocation ?? devicePoint ?? FALLBACK_CENTER;

  // no active request: look up electricians around the device / fallback spot ourselves
  const ownLookup = useNearbyTechnicians(serviceLocation ? undefined : center);
  const realTechnicians: MapTechnician[] = serviceLocation ? serviceTechnicians : ownLookup.technicians;
  const loading = serviceLocation ? serviceLoading : ownLookup.loading;

  const demoTechnicians = useMemo(
    () => (DEMO_TECHNICIANS_ENABLED && !loading && realTechnicians.length === 0 ? makeDemoTechnicians(center) : []),
    // center is a new object each render, so depend on its numbers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, realTechnicians.length, center.latitude, center.longitude],
  );
  const showingDemo = demoTechnicians.length > 0;
  const everyone = showingDemo ? demoTechnicians : realTechnicians;

  const nearbyAvailable = everyone.filter(
    (technician) => technician.availability === 'available' && technician.distanceMiles <= NEARBY_MILES,
  );
  const count = nearbyAvailable.length;
  const closest = nearbyAvailable[0];

  const [tileStatus, setTileStatus] = useState<TileStatus>('ok');

  const markers: MapMarker[] = useMemo(
    () => everyone
      .filter((technician) => technician.distanceMiles <= NEARBY_MILES)
      .slice(0, PREVIEW_PIN_LIMIT)
      .map((technician) => ({
        id: technician.id,
        kind: 'technician',
        latitude: technician.latitude,
        longitude: technician.longitude,
        label: initialsOf(technician.name),
        title: technician.name,
        tone: technician.availability === 'busy' ? 'busy' : 'available',
      })),
    [everyone],
  );

  const pillText = loading
    ? 'Finding electricians…'
    : count === 0
      ? 'None nearby right now'
      : `${count} ${count === 1 ? 'electrician' : 'electricians'} nearby`;

  const placeText = source === 'service'
    ? serviceLabel || 'Your service address'
    : source === 'device'
      ? 'Your location'
      : 'Sacramento area';

  const title = loading
    ? 'Checking who’s available…'
    : closest
      ? `${firstNameOf(closest.name)} is closest`
      : 'No electricians available nearby';

  const detail = loading
    ? 'This only takes a moment.'
    : closest
      ? `${formatShortMinutes(estimateDriveMinutes(closest.distanceMiles))} away · ★ ${formatRatingShort(closest.rating)} · ${formatMiles(closest.distanceMiles)}`
      : source === 'fallback'
        ? 'Add your address to see who can reach you.'
        : 'Open the map to search another area.';

  const openMap = () => router.push('/technician-map');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pillText} near ${placeText}. ${title}. ${detail}. Open map.`}
      onPress={openMap}
      style={({ pressed }) => [previewStyles.card, pressed && previewStyles.cardPressed]}
    >
      <View style={previewStyles.mapBox} pointerEvents="none">
        {/* radar backdrop: shows while tiles load and if they fail */}
        <View style={previewStyles.backdrop}>
          <View style={[previewStyles.ring, previewStyles.ringOuter]} />
          <View style={[previewStyles.ring, previewStyles.ringInner]} />
        </View>

        {tileStatus === 'ok' && (
          <ServiceMap
            center={center}
            markers={markers}
            interactive={false}
            theme="dark"
            bottomInset={30}
            onTileStatus={setTileStatus}
          />
        )}

        {tileStatus === 'failed' && (
          <View style={previewStyles.offline}>
            <Text style={previewStyles.offlineText}>Map is offline. Tap to open the full map.</Text>
          </View>
        )}

        <View style={previewStyles.topRow}>
          <View style={previewStyles.pill}>
            <LiveDot active={!loading && count > 0} />
            <Text style={previewStyles.pillText} numberOfLines={1}>{pillText}</Text>
          </View>
        </View>

        <View style={previewStyles.placeChip}>
          <View style={[previewStyles.placeDot, source === 'fallback' && previewStyles.placeDotFallback]} />
          <Text style={previewStyles.placeText} numberOfLines={1}>{placeText}</Text>
        </View>
      </View>

      <View style={previewStyles.footer}>
        <AvatarStack technicians={nearbyAvailable} />
        <View style={previewStyles.copy}>
          <Text style={previewStyles.title} numberOfLines={1}>{title}</Text>
          <Text style={previewStyles.detail} numberOfLines={1}>{detail}</Text>
        </View>
        <View style={previewStyles.openButton}>
          <Text style={previewStyles.openText}>Open map</Text>
          <Text style={previewStyles.openArrow}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const FLOAT_SHADOW = '0px 4px 12px rgba(0, 0, 0, 0.45)';

const previewStyles = StyleSheet.create({
  card: {
    backgroundColor: MAP_COLORS.panel,
    borderColor: MAP_COLORS.line,
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  mapBox: { backgroundColor: MAP_COLORS.land, height: 190, overflow: 'hidden' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  ring: { borderColor: 'rgba(245, 185, 0, 0.22)', borderWidth: 1, position: 'absolute' },
  ringOuter: { borderRadius: 75, height: 150, width: 150 },
  ringInner: { borderRadius: 45, height: 90, width: 90 },
  offline: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 44 },
  offlineText: { color: MAP_COLORS.muted, fontSize: 12, fontWeight: '600' },

  topRow: { alignItems: 'center', flexDirection: 'row', gap: 8, left: 12, position: 'absolute', right: 12, top: 12 },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 19, 0.86)',
    borderColor: 'rgba(126, 226, 168, 0.35)',
    borderRadius: 999,
    borderWidth: 1,
    boxShadow: FLOAT_SHADOW,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: { color: MAP_COLORS.text, flexShrink: 1, fontSize: 13, fontWeight: '800' },
  liveDotBox: { alignItems: 'center', height: 10, justifyContent: 'center', width: 10 },
  liveHalo: { backgroundColor: MAP_COLORS.available, borderRadius: 5, height: 10, position: 'absolute', width: 10 },
  liveDot: { backgroundColor: MAP_COLORS.available, borderRadius: 4, height: 8, width: 8 },
  liveDotIdle: { backgroundColor: MAP_COLORS.busy },
  placeChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 19, 0.86)',
    borderRadius: 10,
    bottom: 10,
    boxShadow: FLOAT_SHADOW,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    maxWidth: '62%',
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
  },
  placeDot: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.night, borderRadius: 5, borderWidth: 2, height: 10, width: 10 },
  placeDotFallback: { backgroundColor: MAP_COLORS.muted },
  placeText: { color: '#D7DFEC', flexShrink: 1, fontSize: 12, fontWeight: '700' },

  footer: { alignItems: 'center', borderTopColor: 'rgba(58, 66, 80, 0.6)', borderTopWidth: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  avatars: { flexDirection: 'row' },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#1B2638',
    borderColor: MAP_COLORS.panel,
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarOverlap: { marginLeft: -10 },
  avatarText: { color: MAP_COLORS.available, fontSize: 11, fontWeight: '800' },
  avatarMore: { backgroundColor: '#2A3240' },
  avatarMoreText: { color: '#D7DFEC', fontSize: 11, fontWeight: '800' },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  title: { color: MAP_COLORS.text, fontSize: 15, fontWeight: '800' },
  detail: { color: '#AAB5C7', fontSize: 13 },
  openButton: { alignItems: 'center', backgroundColor: MAP_COLORS.volt, borderRadius: 12, flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingVertical: 10 },
  openText: { color: MAP_COLORS.night, fontSize: 13, fontWeight: '800' },
  openArrow: { color: MAP_COLORS.night, fontSize: 18, fontWeight: '800', lineHeight: 18, marginTop: -2 },
});
