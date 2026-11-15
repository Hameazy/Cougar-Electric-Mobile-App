// The small round buttons that float over the map (locate me, map style,
// legend, zoom) and the legend card. Icons are drawn with plain Views so we
// don't depend on an icon font.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MAP_COLORS, type MapTheme } from './ServiceMapTypes';

function RoundButton({
  label,
  onPress,
  active = false,
  children,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [controlStyles.round, active && controlStyles.roundActive, pressed && controlStyles.pressed]}
    >
      {children}
    </Pressable>
  );
}

function LocateIcon({ color }: { color: string }) {
  return (
    <View style={[controlStyles.locateRing, { borderColor: color }]}>
      <View style={[controlStyles.locateDot, { backgroundColor: color }]} />
    </View>
  );
}

function LayersIcon({ color }: { color: string }) {
  return (
    <View style={controlStyles.layersWrap}>
      <View style={[controlStyles.layerBack, { borderColor: color }]} />
      <View style={[controlStyles.layerFront, { borderColor: color }]} />
    </View>
  );
}

export function MapSideControls({
  locating,
  locateActive,
  onLocate,
  theme,
  onToggleTheme,
  legendOpen,
  onToggleLegend,
}: {
  locating: boolean;
  locateActive: boolean;
  onLocate: () => void;
  theme: MapTheme;
  onToggleTheme: () => void;
  legendOpen: boolean;
  onToggleLegend: () => void;
}) {
  return (
    <View style={controlStyles.column}>
      <RoundButton label="Find my location" onPress={onLocate} active={locateActive}>
        {locating
          ? <ActivityIndicator color={MAP_COLORS.volt} />
          : <LocateIcon color={locateActive ? MAP_COLORS.you : MAP_COLORS.text} />}
      </RoundButton>
      <RoundButton
        label={theme === 'dark' ? 'Switch to bright street map' : 'Switch to dark map'}
        onPress={onToggleTheme}
      >
        <LayersIcon color={MAP_COLORS.text} />
      </RoundButton>
      <RoundButton label={legendOpen ? 'Hide map key' : 'Show map key'} onPress={onToggleLegend} active={legendOpen}>
        <Text style={controlStyles.glyph}>?</Text>
      </RoundButton>
    </View>
  );
}

export function ZoomControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <View style={controlStyles.zoom}>
      <Pressable
        accessibilityLabel="Zoom in"
        accessibilityRole="button"
        onPress={onZoomIn}
        style={({ pressed }) => [controlStyles.zoomButton, pressed && controlStyles.pressed]}
      >
        <Text style={controlStyles.glyph}>+</Text>
      </Pressable>
      <View style={controlStyles.zoomDivider} />
      <Pressable
        accessibilityLabel="Zoom out"
        accessibilityRole="button"
        onPress={onZoomOut}
        style={({ pressed }) => [controlStyles.zoomButton, pressed && controlStyles.pressed]}
      >
        <Text style={controlStyles.glyph}>−</Text>
      </Pressable>
    </View>
  );
}

export function MapLegend({ showChargers }: { showChargers: boolean }) {
  return (
    <View style={controlStyles.legend}>
      <View style={controlStyles.legendRow}><View style={controlStyles.keyHome} /><Text style={controlStyles.legendText}>Service address</Text></View>
      <View style={controlStyles.legendRow}><View style={controlStyles.keyYou} /><Text style={controlStyles.legendText}>You are here</Text></View>
      <View style={controlStyles.legendRow}><View style={controlStyles.keyTech} /><Text style={controlStyles.legendText}>Available electrician</Text></View>
      <View style={controlStyles.legendRow}><View style={[controlStyles.keyTech, controlStyles.keyBusy]} /><Text style={controlStyles.legendText}>On another job</Text></View>
      <View style={controlStyles.legendRow}><View style={[controlStyles.keyTech, controlStyles.keyPicked]} /><Text style={controlStyles.legendText}>Selected</Text></View>
      {showChargers && (
        <View style={controlStyles.legendRow}><View style={controlStyles.keyCharger} /><Text style={controlStyles.legendText}>Public EV charger</Text></View>
      )}
      <View style={controlStyles.legendRow}><View style={controlStyles.keyRing} /><Text style={controlStyles.legendText}>Distance rings (straight line)</Text></View>
      <View style={controlStyles.legendRow}><View style={controlStyles.keyRoute} /><Text style={controlStyles.legendText}>Driving route</Text></View>
    </View>
  );
}

const FLOAT_BACKGROUND = 'rgba(17, 23, 34, 0.94)';

const controlStyles = StyleSheet.create({
  column: { gap: 10 },
  round: { alignItems: 'center', backgroundColor: FLOAT_BACKGROUND, borderColor: MAP_COLORS.line, borderRadius: 24, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  roundActive: { borderColor: MAP_COLORS.you },
  pressed: { opacity: 0.7 },
  glyph: { color: MAP_COLORS.text, fontSize: 24, fontWeight: '600', lineHeight: 28 },

  locateRing: { alignItems: 'center', borderRadius: 10, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 },
  locateDot: { borderRadius: 3, height: 6, width: 6 },
  layersWrap: { height: 22, width: 22 },
  layerBack: { borderRadius: 4, borderWidth: 2, height: 14, left: 0, position: 'absolute', top: 0, width: 14 },
  layerFront: { backgroundColor: FLOAT_BACKGROUND, borderRadius: 4, borderWidth: 2, bottom: 0, height: 14, position: 'absolute', right: 0, width: 14 },

  zoom: { backgroundColor: FLOAT_BACKGROUND, borderColor: MAP_COLORS.line, borderRadius: 16, borderWidth: 1, overflow: 'hidden', width: 48 },
  zoomButton: { alignItems: 'center', height: 46, justifyContent: 'center' },
  zoomDivider: { backgroundColor: MAP_COLORS.line, height: 1 },

  legend: { backgroundColor: 'rgba(17, 23, 34, 0.97)', borderColor: MAP_COLORS.line, borderRadius: 14, borderWidth: 1, gap: 9, padding: 12 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  legendText: { color: '#D7DFEC', fontSize: 12 },
  keyHome: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.night, borderRadius: 7, borderWidth: 3, height: 14, width: 14 },
  keyYou: { backgroundColor: MAP_COLORS.you, borderColor: '#FFFFFF', borderRadius: 7, borderWidth: 2, height: 14, width: 14 },
  keyTech: { backgroundColor: MAP_COLORS.panel, borderColor: MAP_COLORS.available, borderRadius: 5, borderWidth: 2, height: 14, width: 14 },
  keyBusy: { borderColor: MAP_COLORS.busy },
  keyPicked: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.volt },
  keyCharger: { backgroundColor: MAP_COLORS.charger, borderRadius: 4, height: 14, width: 14 },
  keyRing: { borderColor: 'rgba(245, 185, 0, 0.6)', borderRadius: 7, borderWidth: 1, height: 14, width: 14 },
  keyRoute: { backgroundColor: MAP_COLORS.volt, borderRadius: 2, height: 4, width: 14 },
});
