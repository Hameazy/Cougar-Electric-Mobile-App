// Phone version of the map (iOS + Android), built on react-native-maps.
// iOS shows Apple Maps and Android shows Google Maps. Both work in Expo Go
// with no API key. A Google Maps key is only needed later for a real Android
// build (see the CE-34 setup notes). The browser version lives in ServiceMap.web.tsx.
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import {
  MAP_COLORS,
  MILES_TO_METERS,
  pointNorthOf,
  type MapMarker,
  type ServiceMapProps,
} from './ServiceMapTypes';

// Navy night style for Google Maps (Android). Apple Maps ignores this and uses
// userInterfaceStyle="dark" instead.
const NIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1422' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8290a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#070b13' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2638' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3a55' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050c18' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
];

function ServiceLocationPin() {
  return (
    <View style={pinStyles.homeHalo}>
      <View style={pinStyles.home} />
    </View>
  );
}

function UserDot() {
  return (
    <View style={pinStyles.youHalo}>
      <View style={pinStyles.you} />
    </View>
  );
}

function MarkerPin({ marker, selected, compact }: { marker: MapMarker; selected: boolean; compact: boolean }) {
  // the dashboard preview is small, so compact initials badges instead of name tags
  if (compact) {
    const busy = marker.tone === 'busy';
    return (
      <View style={pinStyles.miniWrap}>
        <View style={[pinStyles.mini, busy && pinStyles.miniBusy]}>
          <Text style={[pinStyles.miniText, busy && pinStyles.techTextBusy]}>{marker.label}</Text>
        </View>
        <View style={[pinStyles.miniTail, busy && pinStyles.miniTailBusy]} />
      </View>
    );
  }

  if (marker.kind === 'charger') {
    return (
      <View style={[pinStyles.charger, selected && pinStyles.chargerSelected]}>
        <Text style={pinStyles.chargerText}>EV</Text>
      </View>
    );
  }

  const busy = marker.tone === 'busy';
  return (
    <View style={pinStyles.techWrap}>
      <View style={[pinStyles.tech, busy && pinStyles.techBusy, selected && pinStyles.techSelected]}>
        <Text style={[pinStyles.techText, busy && pinStyles.techTextBusy, selected && pinStyles.techTextSelected]}>{marker.label}</Text>
      </View>
      <View style={[pinStyles.tail, busy && pinStyles.tailBusy, selected && pinStyles.tailSelected]} />
    </View>
  );
}

export function ServiceMap({
  ref,
  center,
  markers,
  selectedId,
  onSelectMarker,
  onPressMap,
  routePath,
  routeTo,
  userLocation,
  showServiceLocation = true,
  rings = [],
  interactive = true,
  bottomInset = 0,
  topInset = 0,
  leftInset = 0,
  rightInset = 0,
  theme = 'dark',
  style,
}: ServiceMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  // where the map is looking right now, so the +/- buttons know what to zoom from
  const regionRef = useRef<Region | null>(null);

  // Zoom the map: to the home + picked pin (and its road route) when someone is
  // selected, otherwise to the home + every pin.
  function fitEverything() {
    const map = mapRef.current;
    if (!ready || !map) return;

    const picked = markers.find((marker) => marker.id === selectedId);
    const points = [center, ...(picked ? [picked] : markers), ...(picked && routePath ? routePath : [])]
      .map(({ latitude, longitude }) => ({ latitude, longitude }));
    if (points.length === 1) {
      map.animateToRegion({ ...center, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 400);
      return;
    }
    // the small dashboard preview gets tight padding so pins don't bunch up
    const side = !interactive ? 24 : picked ? 70 : 50;
    map.fitToCoordinates(points, {
      edgePadding: {
        top: topInset + (!interactive ? 40 : picked ? 80 : 60),
        right: side + rightInset,
        bottom: bottomInset + (!interactive ? 12 : picked ? 70 : 50),
        left: side + leftInset,
      },
      animated: true,
    });
  }

  useEffect(() => {
    fitEverything();
    // markers.length is enough here, we don't want to re-zoom every time Firestore sends an update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, center.latitude, center.longitude, markers.length, selectedId, routePath, bottomInset, topInset, leftInset, rightInset, interactive]);

  useImperativeHandle(ref, () => ({
    zoomBy: (steps) => {
      const region = regionRef.current;
      if (!region) return;
      const scale = 2 ** steps;
      mapRef.current?.animateToRegion({
        ...region,
        latitudeDelta: region.latitudeDelta / scale,
        longitudeDelta: region.longitudeDelta / scale,
      }, 250);
    },
    panTo: (point) => {
      const region = regionRef.current;
      mapRef.current?.animateToRegion({
        latitude: point.latitude,
        longitude: point.longitude,
        // zoom in a bit if we're far out, otherwise keep the current zoom
        latitudeDelta: Math.min(region?.latitudeDelta ?? 0.05, 0.05),
        longitudeDelta: Math.min(region?.longitudeDelta ?? 0.05, 0.05),
      }, 450);
    },
    showAll: fitEverything,
  }));

  return (
    <MapView
      ref={mapRef}
      style={[StyleSheet.absoluteFill, style]}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={theme === 'dark' ? NIGHT_STYLE : undefined}
      userInterfaceStyle={theme === 'dark' ? 'dark' : 'light'}
      initialRegion={{ ...center, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
      onMapReady={() => setReady(true)}
      onRegionChangeComplete={(region) => { regionRef.current = region; }}
      onPress={onPressMap}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsCompass={false}
      showsPointsOfInterests={false}
    >
      {rings.map((miles) => (
        <Circle
          key={`ring-${miles}`}
          center={center}
          radius={miles * MILES_TO_METERS}
          strokeColor="rgba(245, 185, 0, 0.35)"
          strokeWidth={1}
          fillColor={miles === rings[0] ? 'rgba(245, 185, 0, 0.06)' : 'transparent'}
        />
      ))}
      {interactive && rings.map((miles) => (
        <Marker
          key={`ring-label-${miles}`}
          coordinate={pointNorthOf(center, miles)}
          anchor={{ x: 0.5, y: 0.5 }}
          tappable={false}
        >
          <View style={pinStyles.ringLabel}><Text style={pinStyles.ringLabelText}>{miles} mi</Text></View>
        </Marker>
      ))}

      {routePath && routePath.length > 1 ? (
        <>
          <Polyline coordinates={routePath} strokeColor="rgba(7, 11, 19, 0.55)" strokeWidth={8} />
          <Polyline coordinates={routePath} strokeColor={MAP_COLORS.volt} strokeWidth={4} />
        </>
      ) : routeTo ? (
        <Polyline
          coordinates={[center, routeTo]}
          strokeColor={MAP_COLORS.volt}
          strokeWidth={3}
          lineDashPattern={[10, 8]}
        />
      ) : null}

      {showServiceLocation && (
        <Marker coordinate={center} anchor={{ x: 0.5, y: 0.5 }} title="Service location" tappable={false}>
          <ServiceLocationPin />
        </Marker>
      )}

      {userLocation && interactive && (
        <>
          {!!userLocation.accuracyMeters && userLocation.accuracyMeters > 15 && (
            <Circle
              center={userLocation}
              radius={userLocation.accuracyMeters}
              strokeColor="rgba(59, 130, 246, 0.4)"
              strokeWidth={1}
              fillColor="rgba(59, 130, 246, 0.12)"
            />
          )}
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} title="Your location" tappable={false}>
            <UserDot />
          </Marker>
        </>
      )}

      {markers.map((marker) => (
        <Marker
          key={`${marker.kind}-${marker.id}`}
          coordinate={marker}
          anchor={marker.kind === 'technician' ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }}
          centerOffset={marker.kind === 'technician' ? { x: 0, y: interactive ? -21 : -15 } : undefined}
          accessibilityLabel={marker.title}
          onPress={(event) => {
            event.stopPropagation?.();
            onSelectMarker?.(marker.id);
          }}
          zIndex={marker.id === selectedId ? 10 : 1}
        >
          <MarkerPin marker={marker} selected={marker.id === selectedId} compact={!interactive} />
        </Marker>
      ))}
    </MapView>
  );
}

const pinStyles = StyleSheet.create({
  homeHalo: { alignItems: 'center', backgroundColor: 'rgba(245, 185, 0, 0.22)', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  home: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.night, borderRadius: 11, borderWidth: 4, height: 22, width: 22 },
  youHalo: { alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  you: { backgroundColor: MAP_COLORS.you, borderColor: '#FFFFFF', borderRadius: 9, borderWidth: 3, height: 18, width: 18 },
  techWrap: { alignItems: 'center' },
  tech: { alignItems: 'center', backgroundColor: MAP_COLORS.panel, borderColor: MAP_COLORS.available, borderRadius: 12, borderWidth: 2, height: 36, justifyContent: 'center', minWidth: 36, paddingHorizontal: 6 },
  techBusy: { borderColor: MAP_COLORS.busy },
  techSelected: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.volt, height: 42, minWidth: 42 },
  techText: { color: MAP_COLORS.text, fontSize: 13, fontWeight: '800' },
  techTextBusy: { color: MAP_COLORS.muted },
  techTextSelected: { color: MAP_COLORS.night, fontSize: 15 },
  tail: { backgroundColor: MAP_COLORS.available, height: 7, width: 2 },
  tailBusy: { backgroundColor: MAP_COLORS.busy },
  tailSelected: { backgroundColor: MAP_COLORS.volt, width: 3 },
  charger: { alignItems: 'center', backgroundColor: MAP_COLORS.charger, borderColor: MAP_COLORS.night, borderRadius: 7, borderWidth: 2, height: 28, justifyContent: 'center', width: 28 },
  chargerSelected: { borderColor: MAP_COLORS.volt, height: 34, width: 34 },
  chargerText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  dot: { backgroundColor: MAP_COLORS.available, borderColor: MAP_COLORS.night, borderRadius: 7, borderWidth: 3, height: 14, width: 14 },
  miniWrap: { alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3 },
  mini: { alignItems: 'center', backgroundColor: MAP_COLORS.panel, borderColor: MAP_COLORS.available, borderRadius: 13, borderWidth: 2, height: 26, justifyContent: 'center', width: 26 },
  miniBusy: { borderColor: MAP_COLORS.busy },
  miniText: { color: MAP_COLORS.text, fontSize: 10, fontWeight: '800' },
  miniTail: { borderLeftColor: 'transparent', borderLeftWidth: 4, borderRightColor: 'transparent', borderRightWidth: 4, borderTopColor: MAP_COLORS.available, borderTopWidth: 5, height: 0, marginTop: -1, width: 0 },
  miniTailBusy: { borderTopColor: MAP_COLORS.busy },
  ringLabel: { backgroundColor: 'rgba(7, 11, 19, 0.85)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  ringLabelText: { color: MAP_COLORS.volt, fontSize: 10, fontWeight: '700' },
});
