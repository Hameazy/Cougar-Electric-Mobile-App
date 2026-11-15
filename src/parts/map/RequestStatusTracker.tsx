// Small progress bar for the customer's active request:
// Requested -> Matched -> On the way -> Arrived.
// It reads the status that the matching workflow writes on serviceRequests.
import { StyleSheet, Text, View } from 'react-native';
import type { ActiveServiceRequest } from '../../serviceRequests/ActiveServiceRequestTypes';
import { formatArrival } from '../MatchedTechnicianCard';
import { MAP_COLORS } from './ServiceMapTypes';

const STEPS = ['Requested', 'Matched', 'On the way', 'Arrived'];

function stepFor(status: ActiveServiceRequest['status']): number {
  switch (status) {
    case 'matched': return 1;
    case 'en-route': return 2;
    case 'arrived':
    case 'in-progress': return 3;
    default: return 0;
  }
}

function headlineFor(request: ActiveServiceRequest): string {
  const name = request.assignedTechnician?.name?.split(' ')[0];
  switch (request.status) {
    case 'pending': return 'Finding your electrician';
    case 'matched': return name ? `${name} accepted your request` : 'An electrician accepted your request';
    case 'en-route': return name ? `${name} is on the way` : 'Your electrician is on the way';
    case 'arrived': return name ? `${name} has arrived` : 'Your electrician has arrived';
    case 'in-progress': return 'Work in progress';
    default: return 'Request received';
  }
}

export function RequestStatusTracker({ request }: { request: ActiveServiceRequest }) {
  const current = stepFor(request.status);
  const showArrival = (request.status === 'matched' || request.status === 'en-route') && request.estimatedArrivalAt;

  return (
    <View
      accessible
      accessibilityLabel={`${headlineFor(request)}. Step ${current + 1} of ${STEPS.length}: ${STEPS[current]}.`}
      style={trackerStyles.wrap}
    >
      <View style={trackerStyles.top}>
        <Text style={trackerStyles.headline} numberOfLines={1}>{headlineFor(request)}</Text>
        {showArrival && (
          <Text style={trackerStyles.arrival}>Arrives {formatArrival(request.estimatedArrivalAt)}</Text>
        )}
      </View>
      <View style={trackerStyles.bars}>
        {STEPS.map((step, index) => (
          <View key={step} style={trackerStyles.step}>
            <View style={[trackerStyles.bar, index <= current && trackerStyles.barDone]} />
            <Text style={[trackerStyles.stepText, index === current && trackerStyles.stepTextNow]}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const trackerStyles = StyleSheet.create({
  wrap: { backgroundColor: '#132039', borderColor: '#29466E', borderRadius: 14, borderWidth: 1, gap: 10, padding: 12 },
  top: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  headline: { color: MAP_COLORS.text, flexShrink: 1, fontSize: 15, fontWeight: '800' },
  arrival: { color: MAP_COLORS.volt, fontSize: 13, fontVariant: ['tabular-nums'], fontWeight: '800' },
  bars: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, gap: 5 },
  bar: { backgroundColor: '#2A3A55', borderRadius: 2, height: 4 },
  barDone: { backgroundColor: MAP_COLORS.volt },
  stepText: { color: MAP_COLORS.muted, fontSize: 10, fontWeight: '600' },
  stepTextNow: { color: MAP_COLORS.text, fontWeight: '800' },
});
