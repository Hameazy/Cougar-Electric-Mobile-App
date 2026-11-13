import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '../helpers/useAuthSession';
import { BackButton } from '../parts/BackButton';
import {
  formatArrival,
  formatRating,
  formatVehicle,
} from '../parts/MatchedTechnicianCard';
import { formatServiceDate } from '../serviceRequests/SchedulePreferenceUtils';
import type { ActiveServiceRequest } from '../serviceRequests/ActiveServiceRequestTypes';
import { useActiveServiceRequests } from '../serviceRequests/useActiveServiceRequests';
import { styles } from '../styles/PageStyle';

function formatStatus(status: string): string {
  return status.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTiming(request: ActiveServiceRequest): string {
  if (request.timing === 'asap') return 'Urgent · As soon as possible';
  if (request.timing === 'scheduled') {
    const date = request.schedulePreference?.day;
    return date
      ? `Preferred date · ${formatServiceDate(date)} · Pending confirmation`
      : 'Scheduled · Preferred date unavailable';
  }
  return 'Service timing unavailable';
}

function formatAddress(request: ActiveServiceRequest): string {
  const locality = [
    request.city,
    [request.state, request.zip].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');
  return [request.address, locality].filter(Boolean).join('\n')
    || 'Service address unavailable';
}

function DetailRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={detailStyles.detailRow}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, accent && detailStyles.accent]}>{value}</Text>
    </View>
  );
}

export default function ActiveServiceRequestDetails() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { user, loading: loadingAuth } = useAuthSession();
  const {
    requests,
    loading: loadingRequests,
    errorMessage,
  } = useActiveServiceRequests(user?.id);
  const request = requests.find((item) => item.id === requestId);
  const loading = loadingAuth || loadingRequests;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={detailStyles.content}>
        <View style={detailStyles.header}>
          <View style={detailStyles.headerSide}>
            <BackButton accessibilityLabel="Back to Home" fallback="/dashboard" textStyle={styles.textLink}>← Back</BackButton>
          </View>
          <Text accessibilityRole="header" style={detailStyles.heading}>Request Details</Text>
          <View style={detailStyles.headerSide} />
        </View>

        {loading && (
          <View style={detailStyles.centeredState}>
            <ActivityIndicator color="#F5B900" />
            <Text style={detailStyles.stateText}>Loading request…</Text>
          </View>
        )}

        {!loading && !!errorMessage && (
          <View style={detailStyles.errorBox}>
            <Text accessibilityRole="alert" style={detailStyles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {!loading && !errorMessage && !user && (
          <Text style={detailStyles.stateText}>Please sign in again to view this request.</Text>
        )}

        {!loading && !errorMessage && user && !request && (
          <Text style={detailStyles.stateText}>This request is no longer active or is not available.</Text>
        )}

        {request && (
          <>
            <View style={detailStyles.card}>
              <Text selectable style={detailStyles.requestId}>REQUEST #{request.id.slice(0, 8).toUpperCase()}</Text>
              <DetailRow label="ELECTRICAL ISSUE" value={request.issueType || 'Electrical issue unavailable'} />
              <DetailRow label="STATUS" value={formatStatus(request.status)} accent />
              <DetailRow label="SERVICE TIMING" value={formatTiming(request)} />
              <DetailRow label="PROBLEM DESCRIPTION" value={request.description || 'Problem description unavailable'} />
              <DetailRow label="SERVICE ADDRESS" value={formatAddress(request)} />
            </View>

            <View style={detailStyles.card}>
              <Text accessibilityRole="header" style={detailStyles.sectionTitle}>Technician</Text>
              {request.assignedTechnician ? (
                <>
                  <DetailRow label="NAME" value={request.assignedTechnician.name || 'Name unavailable'} />
                  <DetailRow label="RATING" value={formatRating(request.assignedTechnician.rating)} />
                  <DetailRow label="VEHICLE" value={formatVehicle(request)} />
                  <DetailRow label="ESTIMATED ARRIVAL" value={formatArrival(request.estimatedArrivalAt)} accent />
                </>
              ) : (
                <View style={detailStyles.pendingBox}>
                  <Text style={detailStyles.pendingTitle}>
                    {request.status === 'pending' ? 'Finding your electrician' : 'Technician details unavailable'}
                  </Text>
                  <Text style={detailStyles.pendingText}>
                    {request.status === 'pending'
                      ? 'Technician details and arrival time will appear here once assigned.'
                      : 'The assigned technician information is still being updated.'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const detailStyles = StyleSheet.create({
  content: { alignSelf: 'center', gap: 16, maxWidth: 600, padding: 22, paddingBottom: 40, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 4, marginTop: 4 },
  headerSide: { width: 72 },
  heading: { color: '#F8FAFC', flex: 1, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  centeredState: { alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 220 },
  stateText: { color: '#AAB5C7', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorBox: { backgroundColor: '#301B20', borderColor: '#74313A', borderRadius: 12, borderWidth: 1, padding: 14 },
  errorText: { color: '#FFB1A8', fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 18, borderWidth: 1, gap: 17, padding: 18 },
  requestId: { color: '#8290A6', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  detailRow: { gap: 5 },
  label: { color: '#8290A6', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  value: { color: '#EAF1FA', fontSize: 14, lineHeight: 21 },
  accent: { color: '#F5B900', fontWeight: '700' },
  pendingBox: { backgroundColor: '#17233A', borderRadius: 12, padding: 14 },
  pendingTitle: { color: '#EAF1FA', fontSize: 15, fontWeight: '700' },
  pendingText: { color: '#AAB5C7', fontSize: 13, lineHeight: 20, marginTop: 5 },
});
