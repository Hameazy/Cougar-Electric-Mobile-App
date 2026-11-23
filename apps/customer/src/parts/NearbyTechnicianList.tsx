import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RankedTechnician } from '../technicians/AvailableTechnicianTypes';
import { styles } from '../styles/PageStyle';

function formatDistance(distanceMiles: number): string {
  if (distanceMiles < 0.1) return 'Less than 0.1 mi away';
  return `${distanceMiles.toFixed(1)} mi away`;
}

function formatRating(rating?: number): string {
  return rating === undefined ? 'Rating unavailable' : `${rating.toFixed(1)} ★`;
}

function TechnicianRow({ technician }: { technician: RankedTechnician }) {
  return (
    <View style={nearbyStyles.row}>
      <View style={nearbyStyles.rowCopy}>
        <Text style={nearbyStyles.name}>{technician.name}</Text>
        <Text style={nearbyStyles.meta}>{formatDistance(technician.distanceMiles)} · {formatRating(technician.rating)}</Text>
      </View>
      <View style={nearbyStyles.availableBadge}><Text style={nearbyStyles.availableText}>AVAILABLE</Text></View>
    </View>
  );
}

export function NearbyTechnicianList({
  loading,
  technicians,
  errorMessage,
  onRetry,
}: {
  loading: boolean;
  technicians: RankedTechnician[];
  errorMessage: string;
  onRetry?: () => void;
}) {
  return (
    <View style={nearbyStyles.container}>
      <Text style={nearbyStyles.heading}>NEAREST AVAILABLE TECHNICIANS</Text>
      {loading && <View style={nearbyStyles.state}><ActivityIndicator color="#F5B900" /><Text style={nearbyStyles.stateText}>Finding nearby technicians…</Text></View>}
      {!!errorMessage && <View style={nearbyStyles.error}><Text accessibilityRole="alert" style={nearbyStyles.errorText}>{errorMessage}</Text>{onRetry && <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.textLink}>Try again</Text></Pressable>}</View>}
      {!loading && !errorMessage && technicians.length === 0 && <Text style={nearbyStyles.stateText}>No available technicians found near your service location.</Text>}
      {!loading && !errorMessage && technicians.map((technician) => <TechnicianRow key={technician.id} technician={technician} />)}
    </View>
  );
}

const nearbyStyles = StyleSheet.create({
  container: { gap: 10 },
  heading: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  row: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 68, paddingHorizontal: 14, paddingVertical: 10 },
  rowCopy: { flex: 1, gap: 4 },
  name: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  meta: { color: '#AAB5C7', fontSize: 12 },
  availableBadge: { backgroundColor: '#123426', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  availableText: { color: '#7EE2A8', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  state: { alignItems: 'center', backgroundColor: '#111722', borderRadius: 14, flexDirection: 'row', gap: 10, padding: 15 },
  stateText: { color: '#AAB5C7', fontSize: 13, lineHeight: 19 },
  error: { backgroundColor: '#301B20', borderColor: '#74313A', borderRadius: 12, borderWidth: 1, padding: 14 },
  errorText: { color: '#FFB1A8', fontSize: 13, lineHeight: 19 },
});
