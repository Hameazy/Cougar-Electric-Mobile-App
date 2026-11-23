import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  isCancellationEligibleStatus,
  type ActiveServiceRequest,
} from '../serviceRequests/ActiveServiceRequestTypes';
import { styles } from '../styles/PageStyle';

function formatStatus(status: string): string {
  return status.replace('-', ' ').toUpperCase();
}

export function formatRating(rating?: number): string {
  return rating !== undefined && rating >= 0 && rating <= 5
    ? `${rating.toFixed(1)} / 5`
    : 'Rating unavailable';
}

export function formatVehicle(request: ActiveServiceRequest): string {
  const vehicle = request.assignedTechnician?.vehicle;
  if (!vehicle) return 'Vehicle information unavailable';

  const description = [
    vehicle.color,
    vehicle.year?.toString(),
    vehicle.make,
    vehicle.model,
  ]
    .filter(Boolean)
    .join(' ');
  const plate = vehicle.licensePlate ? ` · Plate ${vehicle.licensePlate}` : '';

  return description ? `${description}${plate}` : 'Vehicle information unavailable';
}

export function formatArrival(arrival?: Date): string {
  if (!arrival) return 'Estimated arrival unavailable';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(arrival);
}

export function MatchedTechnicianCard({
  request,
  onCancel,
}: {
  request: ActiveServiceRequest;
  onCancel: (request: ActiveServiceRequest) => void;
}) {
  const technician = request.assignedTechnician;
  const hasAssignedTechnician = !!technician;
  const isPendingAssignment = request.status === 'pending';

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.headingRow}>
        <View style={cardStyles.headingCopy}>
          <Text style={cardStyles.eyebrow}>{formatStatus(request.status)}</Text>
          <Text accessibilityRole="header" style={cardStyles.title}>
            {request.issueType || 'Electrical service request'}
          </Text>
        </View>
        <Text selectable style={cardStyles.requestId}>#{request.id.slice(0, 8)}</Text>
      </View>

      {!hasAssignedTechnician ? (
        <View style={cardStyles.pendingBox}>
          <Text style={cardStyles.pendingTitle}>
            {isPendingAssignment ? 'Finding your electrician' : 'Technician details unavailable'}
          </Text>
          <Text style={cardStyles.pendingBody}>
            {isPendingAssignment
              ? 'Your request is active. Technician details and arrival time will appear here once assigned.'
              : 'Your request is active, but the assigned technician information is still being updated.'}
          </Text>
        </View>
      ) : (
        <View style={cardStyles.details}>
          <View style={cardStyles.detailRow}>
            <Text style={cardStyles.label}>TECHNICIAN</Text>
            <Text style={cardStyles.value}>{technician.name || 'Name unavailable'}</Text>
          </View>
          <View style={cardStyles.detailRow}>
            <Text style={cardStyles.label}>RATING</Text>
            <Text style={cardStyles.value}>{formatRating(technician.rating)}</Text>
          </View>
          <View style={cardStyles.detailRow}>
            <Text style={cardStyles.label}>VEHICLE</Text>
            <Text style={cardStyles.value}>{formatVehicle(request)}</Text>
          </View>
          <View style={cardStyles.detailRow}>
            <Text style={cardStyles.label}>ESTIMATED ARRIVAL</Text>
            <Text style={[cardStyles.value, cardStyles.arrival]}>
              {formatArrival(request.estimatedArrivalAt)}
            </Text>
          </View>
        </View>
      )}

      {isCancellationEligibleStatus(request.status) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Cancel service request ${request.id}`}
          onPress={() => onCancel(request)}
          style={({ pressed }) => [
            cardStyles.cancelButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={cardStyles.cancelText}>CANCEL REQUEST</Text>
        </Pressable>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 18, borderWidth: 1, padding: 18 },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  headingCopy: { flex: 1 },
  eyebrow: { color: '#F5B900', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 25, marginTop: 5 },
  requestId: { color: '#8290A6', fontSize: 11 },
  pendingBox: { backgroundColor: '#17233A', borderRadius: 12, marginTop: 16, padding: 14 },
  pendingTitle: { color: '#EAF1FA', fontSize: 15, fontWeight: '700' },
  pendingBody: { color: '#AAB5C7', fontSize: 13, lineHeight: 20, marginTop: 5 },
  details: { gap: 13, marginTop: 18 },
  detailRow: { gap: 4 },
  label: { color: '#8290A6', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  value: { color: '#EAF1FA', fontSize: 14, lineHeight: 20 },
  arrival: { color: '#F5B900', fontWeight: '700' },
  cancelButton: { alignItems: 'center', borderColor: '#8B3D47', borderRadius: 12, borderWidth: 1, marginTop: 18, minHeight: 46, justifyContent: 'center', paddingHorizontal: 16 },
  cancelText: { color: '#FFB1A8', fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
});
