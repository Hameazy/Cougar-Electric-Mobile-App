// A straight "wire" from the service address (left end) out to 10+ miles.
// Every available electrician is a dot on the wire, so the customer can see at a
// glance how many people are close and how spread out they are. Tapping a dot
// picks that electrician, same as tapping their pin on the map.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { railLengthMiles, type MapTechnician } from '../../technicians/technicianFilters';
import { formatMiles } from '../../technicians/travelEstimate';
import { MAP_COLORS } from './ServiceMapTypes';

const DOT = 14;
const BIG_DOT = 20;

export function DistanceRail({
  technicians,
  selectedId,
  onSelect,
}: {
  technicians: MapTechnician[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const length = railLengthMiles(technicians.map((technician) => technician.distanceMiles));
  const ticks = Array.from({ length: length / 5 + 1 }, (_, index) => index * 5);
  const closest = technicians[0];

  function xFor(miles: number): number {
    return Math.min(1, miles / length) * width;
  }

  return (
    <View style={railStyles.wrap}>
      <View
        style={railStyles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={railStyles.wire} />
        {width > 0 && ticks.map((miles) => (
          <View key={miles} style={[railStyles.tick, { left: xFor(miles) - 0.5 }]} />
        ))}
        <View style={railStyles.home} accessible={false} />

        {width > 0 && closest && (
          <Text
            accessible={false}
            numberOfLines={1}
            style={[railStyles.closestLabel, { left: Math.max(0, Math.min(width - 60, xFor(closest.distanceMiles) - 30)) }]}
          >
            {formatMiles(closest.distanceMiles)}
          </Text>
        )}

        {width > 0 && technicians.map((technician, index) => {
          const selected = technician.id === selectedId;
          const size = index === 0 || selected ? BIG_DOT : DOT;
          return (
            <Pressable
              key={technician.id}
              accessibilityRole="button"
              accessibilityLabel={`${technician.name}, ${formatMiles(technician.distanceMiles)} away`}
              accessibilityState={{ selected }}
              hitSlop={8}
              onPress={() => onSelect(technician.id)}
              style={[
                railStyles.dot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  left: xFor(technician.distanceMiles) - size / 2,
                  top: 26 - size / 2,
                },
                technician.availability === 'busy' && railStyles.busyDot,
                index === 0 && railStyles.closestDot,
                selected && railStyles.selectedDot,
              ]}
            />
          );
        })}
      </View>

      <View style={railStyles.scale}>
        <Text style={railStyles.scaleText}>Your address</Text>
        <Text style={railStyles.scaleText}>{length} mi</Text>
      </View>
    </View>
  );
}

const railStyles = StyleSheet.create({
  wrap: { gap: 2 },
  track: { height: 40, marginHorizontal: 10 },
  wire: { backgroundColor: MAP_COLORS.line, height: 2, left: 0, position: 'absolute', right: 0, top: 25 },
  tick: { backgroundColor: MAP_COLORS.line, height: 8, position: 'absolute', top: 22, width: 1 },
  home: { backgroundColor: MAP_COLORS.volt, borderRadius: 3, height: 12, left: -6, position: 'absolute', top: 20, width: 12 },
  dot: { backgroundColor: MAP_COLORS.panel, borderColor: MAP_COLORS.available, borderWidth: 3, position: 'absolute' },
  busyDot: { borderColor: MAP_COLORS.busy },
  closestDot: { backgroundColor: MAP_COLORS.available },
  selectedDot: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.volt },
  closestLabel: { color: MAP_COLORS.available, fontSize: 11, fontVariant: ['tabular-nums'], fontWeight: '800', position: 'absolute', textAlign: 'center', top: 0, width: 60 },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleText: { color: MAP_COLORS.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
});
