import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';
import { useAuthSession } from '../helpers/useAuthSession';
import { useTemporaryNotice } from '../helpers/useTemporaryNotice';
import { ElectricalIssueIcon } from '../parts/ElectricalIssueIcon';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';
import { CancelServiceRequestDialog } from '../parts/CancelServiceRequestDialog';
import { useActiveServiceRequests } from '../serviceRequests/useActiveServiceRequests';
import { NearbyTechnicianList } from '../parts/NearbyTechnicianList';
import { useNearbyTechnicians } from '../technicians/useNearbyTechnicians';
import { cancelServiceRequest } from '../serviceRequests/activeServiceRequestRepository';
import {
  isCancellationEligibleStatus,
  type ActiveServiceRequest,
} from '../serviceRequests/ActiveServiceRequestTypes';

const ISSUE_SHORTCUTS: { label: string; issue: ElectricalIssue }[] = [
  { label: 'Power\nOutage', issue: 'Power outage' },
  { label: 'Breaker\nIssues', issue: 'Breaker keeps tripping' },
  { label: 'Outlet\nIssues', issue: 'Outlet not working' },
  { label: 'Lighting', issue: 'Lighting issue' },
  { label: 'EV\nCharger', issue: 'EV charger issue' },
  { label: 'Electrical\nPanel', issue: 'Electrical panel issue' },
];

function formatRequestStatus(status: string): string {
  return status.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CustomerDashboard() {
  const { resetDraft, setIssueType } = useServiceRequestDraft();
  const { user } = useAuthSession();
  const { requests, loading: loadingRequests, errorMessage: requestsError } = useActiveServiceRequests(user?.id);
  const activeLocation = requests.find((request) => request.latitude !== undefined && request.longitude !== undefined);
  const nearby = useNearbyTechnicians(activeLocation);
  const { notice, showNotice } = useTemporaryNotice();
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<ActiveServiceRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState('');

  function startRequest(issue?: ElectricalIssue) {
    resetDraft();
    if (issue) setIssueType(issue);
    router.push(issue ? '/emergency-description' : '/choose-electrical-issue');
  }

  function openCancellationDialog(request: ActiveServiceRequest) {
    setCancellationError('');
    setRequestToCancel(request);
  }

  function openRequestDetails(requestId: string) {
    router.push({
      pathname: '/service-request/[requestId]',
      params: { requestId },
    });
  }

  function keepRequest() {
    if (cancelling) return;
    setCancellationError('');
    setRequestToCancel(null);
  }

  async function confirmCancellation() {
    if (!requestToCancel || !user || cancelling) return;

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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={dashboardStyles.content}>
        <Text accessibilityRole="header" style={dashboardStyles.brandTitle}>
          <Text style={dashboardStyles.brandName}>COUGAR</Text>{'\n'}
          <Text style={dashboardStyles.brandElectric}>ELECTRIC INC.</Text>
        </Text>

        {user && (
          <View style={dashboardStyles.activeRequests}>
            <Text style={dashboardStyles.sectionTitle}>ACTIVE SERVICE REQUESTS</Text>
            {loadingRequests && (
              <View style={dashboardStyles.requestsLoading}>
                <ActivityIndicator color="#F5B900" />
                <Text style={dashboardStyles.requestsLoadingText}>Loading your requests…</Text>
              </View>
            )}
            {!!requestsError && (
              <View style={dashboardStyles.requestError}>
                <Text accessibilityRole="alert" style={dashboardStyles.requestErrorText}>{requestsError}</Text>
              </View>
            )}
            {!loadingRequests && !requestsError && requests.length === 0 && (
              <Text style={dashboardStyles.noRequests}>You have no active service requests.</Text>
            )}
            {!loadingRequests && !requestsError && requests.length > 0 && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: requestsExpanded }}
                  onPress={() => setRequestsExpanded((expanded) => !expanded)}
                  style={({ pressed }) => [
                    dashboardStyles.requestDropdown,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={dashboardStyles.requestCount}>
                    {requests.length} Active {requests.length === 1 ? 'Request' : 'Requests'}
                  </Text>
                  <Text accessible={false} style={dashboardStyles.dropdownChevron}>
                    {requestsExpanded ? '⌃' : '⌄'}
                  </Text>
                </Pressable>

                {requestsExpanded && (
                  <View style={dashboardStyles.requestList}>
                    {requests.map((request) => (
                      <View key={request.id} style={dashboardStyles.requestRow}>
                        <Pressable
                          accessibilityLabel={`View ${request.issueType || 'electrical service'} request`}
                          accessibilityRole="button"
                          onPress={() => openRequestDetails(request.id)}
                          style={({ pressed }) => [
                            dashboardStyles.requestDetailsTarget,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <View style={dashboardStyles.requestRowCopy}>
                            <Text numberOfLines={1} style={dashboardStyles.requestIssue}>
                              {request.issueType || 'Electrical service request'}
                            </Text>
                            <Text style={dashboardStyles.requestStatus}>{formatRequestStatus(request.status)}</Text>
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
                            <Text style={dashboardStyles.compactCancel}>Cancel</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {!!notice && <View style={dashboardStyles.notice}><Text accessibilityLiveRegion="polite" style={dashboardStyles.noticeText}>{notice}</Text></View>}

        <View style={dashboardStyles.actions}>
          {!activeLocation ? (
            <View style={dashboardStyles.notice}><Text style={dashboardStyles.noticeText}>Submit a service request with a service location to find nearby technicians.</Text></View>
          ) : (
            <NearbyTechnicianList {...nearby} />
          )}
        </View>

        <View style={dashboardStyles.shortcuts}>
          <Text style={dashboardStyles.shortcutHeading}>COMMON ELECTRICAL ISSUES</Text>
          <View style={dashboardStyles.serviceGrid}>
            {ISSUE_SHORTCUTS.map((shortcut) => (
              <Pressable
                key={shortcut.issue}
                accessibilityLabel={`Start a request for ${shortcut.issue}`}
                accessibilityRole="button"
                onPress={() => startRequest(shortcut.issue)}
                style={({ pressed }) => [dashboardStyles.serviceCard, pressed && styles.buttonPressed]}
              >
                <ElectricalIssueIcon issue={shortcut.issue} size={30} />
                <Text style={dashboardStyles.serviceLabel}>{shortcut.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => startRequest()}
            style={({ pressed }) => [dashboardStyles.viewAllButton, pressed && styles.buttonPressed]}
          >
            <Text style={dashboardStyles.viewAllText}>VIEW ALL PROBLEMS</Text>
            <Text accessible={false} style={dashboardStyles.viewAllChevron}>›</Text>
          </Pressable>
        </View>
      </ScrollView>

      <CancelServiceRequestDialog
        visible={!!requestToCancel}
        loading={cancelling}
        errorMessage={cancellationError}
        onKeepRequest={keepRequest}
        onConfirm={() => void confirmCancellation()}
      />
    </SafeAreaView>
  );
}

const dashboardStyles = StyleSheet.create({
  content: { alignSelf: 'center', flexGrow: 1, gap: 26, maxWidth: 600, padding: 22, paddingBottom: 26, width: '100%' },
  brandTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.8, lineHeight: 32, marginTop: 8, textAlign: 'center' },
  brandName: { color: '#F8FAFC' },
  brandElectric: { color: '#F5B900' },
  activeRequests: { gap: 12 },
  sectionTitle: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textAlign: 'center' },
  requestsLoading: { alignItems: 'center', backgroundColor: '#111722', borderRadius: 14, flexDirection: 'row', gap: 12, padding: 16 },
  requestsLoadingText: { color: '#AAB5C7', fontSize: 13 },
  requestError: { backgroundColor: '#301B20', borderColor: '#74313A', borderRadius: 12, borderWidth: 1, padding: 14 },
  requestErrorText: { color: '#FFB1A8', fontSize: 13, lineHeight: 20 },
  noRequests: { color: '#8290A6', fontSize: 13, textAlign: 'center' },
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
  actions: { gap: 12 },
  nearbyButton: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 68, paddingHorizontal: 16 },
  nearbyText: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', letterSpacing: 0.7, textAlign: 'center' },
  notice: { backgroundColor: '#132039', borderColor: '#29466E', borderRadius: 12, borderWidth: 1, padding: 12 },
  noticeText: { color: '#AFC4E2', fontSize: 13, textAlign: 'center' },
  shortcuts: { gap: 12 },
  shortcutHeading: { color: '#F5B900', fontSize: 12, fontWeight: '800', letterSpacing: 1.1, textAlign: 'center' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 16, borderWidth: 1, flexBasis: '30%', flexGrow: 1, justifyContent: 'center', minHeight: 112, minWidth: 86, padding: 10 },
  serviceLabel: { color: '#E6EBF2', fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 10, textAlign: 'center' },
  viewAllButton: { alignItems: 'center', borderColor: '#4A5363', borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 52, paddingHorizontal: 42 },
  viewAllText: { color: '#F8FAFC', fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center' },
  viewAllChevron: { color: '#D7DFEC', fontSize: 26, position: 'absolute', right: 16 },
});
