import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuthUser } from '../auth/AuthenticationTypes';
import { useTemporaryNotice } from '../helpers/useTemporaryNotice';
import {
  cancelServiceRequest,
} from '../serviceRequests/activeServiceRequestRepository';
import {
  isCancellationEligibleStatus,
  type ActiveServiceRequest,
} from '../serviceRequests/ActiveServiceRequestTypes';
import { useActiveServiceRequests } from '../serviceRequests/useActiveServiceRequests';
import { useNearbyTechnicians } from '../technicians/useNearbyTechnicians';
import { styles } from '../styles/PageStyle';
import { CancelServiceRequestDialog } from './CancelServiceRequestDialog';
import { ElectricianSearchProgress } from './ElectricianSearchProgress';
import { NearbyMapPreview } from './NearbyMapPreview';
import { NearbyTechnicianList } from './NearbyTechnicianList';

function formatRequestStatus(status: string): string {
  if (status === 'no-match') return 'No electrician accepted';
  return status.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ActiveJobsOverviewProps = {
  onScheduleJob: () => void;
  user: AuthUser;
};

export function ActiveJobsOverview({ onScheduleJob, user }: ActiveJobsOverviewProps) {
  const { requests, loading, errorMessage } = useActiveServiceRequests(user.id);
  const activeLocation = requests.find(
    (request) => request.latitude !== undefined && request.longitude !== undefined,
  );
  const nearby = useNearbyTechnicians(activeLocation);
  const { notice, showNotice } = useTemporaryNotice();
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<ActiveServiceRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState('');
  const routedNoMatchRequestId = useRef<string | null>(null);
  const noMatchRequestId = requests.find((request) => request.status === 'no-match')?.id;

  useEffect(() => {
    if (!noMatchRequestId) {
      routedNoMatchRequestId.current = null;
      return;
    }
    if (routedNoMatchRequestId.current === noMatchRequestId) return;

    routedNoMatchRequestId.current = noMatchRequestId;
    router.replace({
      pathname: '/service-request/[requestId]/no-match',
      params: { requestId: noMatchRequestId },
    });
  }, [noMatchRequestId]);

  function openRequestDetails(requestId: string) {
    router.push({ pathname: '/service-request/[requestId]', params: { requestId } });
  }

  function openCancellationDialog(request: ActiveServiceRequest) {
    setCancellationError('');
    setRequestToCancel(request);
  }

  function keepRequest() {
    if (cancelling) return;
    setCancellationError('');
    setRequestToCancel(null);
  }

  async function confirmCancellation() {
    if (!requestToCancel || cancelling) return;

    setCancelling(true);
    setCancellationError('');
    try {
      await cancelServiceRequest(requestToCancel.id, user.id);
      setRequestToCancel(null);
      showNotice('Your service request was cancelled.');
    } catch (error) {
      setCancellationError(
        error instanceof Error
          ? error.message
          : 'We could not cancel this request. Please try again.',
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <View style={jobStyles.loading}>
        <ActivityIndicator color="#F5B900" />
        <Text style={jobStyles.loadingText}>Loading your jobs…</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={jobStyles.error}>
        <Text accessibilityRole="alert" style={jobStyles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={jobStyles.empty}>
        <Text style={jobStyles.emptyIcon}>▤</Text>
        <Text accessibilityRole="header" style={jobStyles.emptyTitle}>You do not have any jobs scheduled</Text>
        <Text style={jobStyles.emptyBody}>Choose an electrical issue, then tell us when you need service.</Text>
        <Pressable accessibilityRole="button" onPress={onScheduleJob} style={({ pressed }) => [jobStyles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={jobStyles.primaryText}>SCHEDULE A JOB</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={jobStyles.overview}>
      <View style={jobStyles.activeRequests}>
        <Text style={jobStyles.sectionTitle}>ACTIVE SERVICE REQUESTS</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: requestsExpanded }}
          onPress={() => setRequestsExpanded((expanded) => !expanded)}
          style={({ pressed }) => [jobStyles.requestDropdown, pressed && styles.buttonPressed]}
        >
          <Text style={jobStyles.requestCount}>
            {requests.length} Active {requests.length === 1 ? 'Request' : 'Requests'}
          </Text>
          <Text accessible={false} style={jobStyles.dropdownChevron}>{requestsExpanded ? '⌃' : '⌄'}</Text>
        </Pressable>

        {requestsExpanded && (
          <View style={jobStyles.requestList}>
            {requests.map((request) => (
              <View key={request.id} style={jobStyles.requestRow}>
                <Pressable
                  accessibilityLabel={`View ${request.issueType || 'electrical service'} request`}
                  accessibilityRole="button"
                  onPress={() => openRequestDetails(request.id)}
                  style={({ pressed }) => [jobStyles.requestDetailsTarget, pressed && styles.buttonPressed]}
                >
                  <View style={jobStyles.requestRowCopy}>
                    <Text numberOfLines={1} style={jobStyles.requestIssue}>{request.issueType || 'Electrical service request'}</Text>
                    <Text style={jobStyles.requestStatus}>{formatRequestStatus(request.status)}</Text>
                  </View>
                </Pressable>
                {isCancellationEligibleStatus(request.status) && (
                  <Pressable
                    accessibilityLabel={`Cancel ${request.issueType || 'service'} request`}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => openCancellationDialog(request)}
                    style={({ pressed }) => pressed && styles.buttonPressed}
                  >
                    <Text style={jobStyles.compactCancel}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {!!notice && <View style={jobStyles.notice}><Text accessibilityLiveRegion="polite" style={jobStyles.noticeText}>{notice}</Text></View>}

      {requests.filter((request) => request.status === 'pending').map((request) => (
        <ElectricianSearchProgress key={request.id} request={request} onOpen={() => openRequestDetails(request.id)} />
      ))}

      {activeLocation && (
        <>
          <NearbyMapPreview
            serviceLocation={{ latitude: activeLocation.latitude!, longitude: activeLocation.longitude! }}
            serviceLabel={activeLocation.address?.trim() || activeLocation.city?.trim() || undefined}
            technicians={nearby.technicians}
            loading={nearby.loading}
          />
          <NearbyTechnicianList {...nearby} />
        </>
      )}

      <CancelServiceRequestDialog
        visible={!!requestToCancel}
        loading={cancelling}
        errorMessage={cancellationError}
        onKeepRequest={keepRequest}
        onConfirm={() => void confirmCancellation()}
      />
    </View>
  );
}

const jobStyles = StyleSheet.create({
  overview: { gap: 18, marginTop: 24 },
  activeRequests: { gap: 12 },
  sectionTitle: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textAlign: 'center' },
  loading: { alignItems: 'center', backgroundColor: '#111722', borderRadius: 14, flexDirection: 'row', gap: 12, marginTop: 26, padding: 18 },
  loadingText: { color: '#AAB5C7', fontSize: 13 },
  error: { backgroundColor: '#301B20', borderColor: '#74313A', borderRadius: 12, borderWidth: 1, marginTop: 26, padding: 14 },
  errorText: { color: '#FFB1A8', fontSize: 13, lineHeight: 20 },
  requestDropdown: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 14 },
  requestCount: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  dropdownChevron: { color: '#F5B900', fontSize: 22, lineHeight: 24 },
  requestList: { backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  requestRow: { alignItems: 'center', borderBottomColor: '#303846', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingRight: 14 },
  requestDetailsTarget: { flex: 1, justifyContent: 'center', minHeight: 58, paddingHorizontal: 14, paddingVertical: 9 },
  requestRowCopy: { flex: 1 },
  requestIssue: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  requestStatus: { color: '#8290A6', fontSize: 10, fontWeight: '700', letterSpacing: 0.7, marginTop: 4 },
  compactCancel: { color: '#FF6B7F', fontSize: 13, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 8 },
  notice: { backgroundColor: '#132039', borderColor: '#29466E', borderRadius: 12, borderWidth: 1, padding: 12 },
  noticeText: { color: '#AFC4E2', fontSize: 13, textAlign: 'center' },
  empty: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#353F50', borderRadius: 20, borderWidth: 1, marginTop: 26, padding: 28 },
  emptyIcon: { color: '#F5B900', fontSize: 38, marginBottom: 14 },
  emptyTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 28, textAlign: 'center' },
  emptyBody: { color: '#AAB5C7', fontSize: 14, lineHeight: 22, marginTop: 9, textAlign: 'center' },
  primaryButton: { backgroundColor: '#F5B900', borderRadius: 12, marginTop: 22, paddingHorizontal: 34, paddingVertical: 15 },
  primaryText: { color: '#080C14', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});
