import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '../helpers/useAuthSession';
import { CancelServiceRequestDialog } from '../parts/CancelServiceRequestDialog';
import { useActiveServiceRequests } from '../serviceRequests/useActiveServiceRequests';
import {
  cancelServiceRequest,
  retryServiceRequestSearch,
} from '../serviceRequests/activeServiceRequestRepository';
import { isSearchRetryEligibleStatus } from '../serviceRequests/ActiveServiceRequestTypes';
import { styles } from '../styles/PageStyle';

export default function NoElectricianAccepted() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { user, loading: loadingAuth } = useAuthSession();
  const {
    requests,
    loading: loadingRequests,
    errorMessage,
  } = useActiveServiceRequests(user?.id);
  const request = requests.find((item) => item.id === requestId);
  const hasRequest = !!request;
  const retryAvailable = !!request && isSearchRetryEligibleStatus(request.status);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionError, setActionError] = useState('');
  const loading = loadingAuth || loadingRequests;

  useEffect(() => {
    if (!loading && hasRequest && !retryAvailable) {
      router.replace('/dashboard');
    }
  }, [loading, hasRequest, retryAvailable]);

  async function retrySearch() {
    if (!request || !user || retrying || cancelling) return;

    setRetrying(true);
    setActionError('');

    try {
      await retryServiceRequestSearch(request.id, user.id);
      router.replace('/dashboard');
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'We could not retry the search. Please try again.',
      );
    } finally {
      setRetrying(false);
    }
  }

  async function confirmCancellation() {
    if (!request || !user || retrying || cancelling) return;

    setCancelling(true);
    setActionError('');

    try {
      await cancelServiceRequest(request.id, user.id);
      setShowCancelDialog(false);
      router.replace('/dashboard');
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'We could not cancel this request. Please try again.',
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={screenStyles.content}>
        <Text accessibilityRole="header" style={screenStyles.eyebrow}>SERVICE REQUEST UPDATE</Text>
        <View style={screenStyles.card}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={screenStyles.icon}>
            <Text style={screenStyles.iconText}>!</Text>
          </View>
          <Text accessibilityRole="header" style={screenStyles.title}>No electrician accepted yet</Text>
          <Text style={screenStyles.body}>
            {request?.issueType
              ? `We couldn't find an electrician for your ${request.issueType.toLowerCase()} request just yet.`
              : "We couldn't find an electrician for your request just yet."}
            {' '}You can retry the search or cancel this request.
          </Text>

          {!!request && (
            <View style={screenStyles.requestSummary}>
              <Text style={screenStyles.summaryLabel}>REQUEST</Text>
              <Text style={screenStyles.summaryText}>{request.issueType || 'Electrical service request'}</Text>
            </View>
          )}

          {loading && (
            <View style={screenStyles.state}>
              <ActivityIndicator color="#F5B900" />
              <Text style={screenStyles.stateText}>Loading your request…</Text>
            </View>
          )}
          {!!errorMessage && (
            <Text accessibilityRole="alert" style={screenStyles.errorText}>{errorMessage}</Text>
          )}
          {!loading && !errorMessage && !request && (
            <Text style={screenStyles.stateText}>This request is no longer active or available.</Text>
          )}
          {!!actionError && (
            <Text accessibilityRole="alert" style={screenStyles.errorText}>{actionError}</Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: retrying, disabled: !retryAvailable || retrying || cancelling }}
            disabled={!retryAvailable || retrying || cancelling}
            onPress={() => void retrySearch()}
            style={({ pressed }) => [
              screenStyles.retryButton,
              pressed && styles.buttonPressed,
              (!retryAvailable || retrying || cancelling) && screenStyles.disabledButton,
            ]}
          >
            {retrying ? (
              <ActivityIndicator color="#080C14" />
            ) : (
              <Text style={screenStyles.retryText}>RETRY SEARCH</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !retryAvailable || retrying || cancelling }}
            disabled={!retryAvailable || retrying || cancelling}
            onPress={() => {
              setActionError('');
              setShowCancelDialog(true);
            }}
            style={({ pressed }) => [
              screenStyles.cancelButton,
              pressed && styles.buttonPressed,
              (!retryAvailable || retrying || cancelling) && screenStyles.disabledButton,
            ]}
          >
            <Text style={screenStyles.cancelText}>CANCEL REQUEST</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/dashboard')}
            style={({ pressed }) => pressed && styles.buttonPressed}
          >
            <Text style={screenStyles.backText}>BACK TO DASHBOARD</Text>
          </Pressable>
        </View>
      </ScrollView>

      <CancelServiceRequestDialog
        visible={showCancelDialog}
        loading={cancelling}
        errorMessage={actionError}
        onKeepRequest={() => {
          if (!cancelling) setShowCancelDialog(false);
        }}
        onConfirm={() => void confirmCancellation()}
      />
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  content: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: 22, paddingBottom: 36, width: '100%' },
  eyebrow: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 14, textAlign: 'center' },
  card: { alignSelf: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 20, borderWidth: 1, gap: 16, maxWidth: 480, padding: 22, width: '100%' },
  icon: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#332A16', borderColor: '#6E561B', borderRadius: 32, borderWidth: 1, height: 64, justifyContent: 'center', width: 64 },
  iconText: { color: '#F5B900', fontSize: 32, fontWeight: '800' },
  title: { color: '#F8FAFC', fontSize: 25, fontWeight: '800', lineHeight: 32, textAlign: 'center' },
  body: { color: '#AAB5C7', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  requestSummary: { backgroundColor: '#17233A', borderRadius: 12, gap: 6, padding: 14 },
  summaryLabel: { color: '#8290A6', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  summaryText: { color: '#EAF1FA', fontSize: 14, fontWeight: '700' },
  state: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center' },
  stateText: { color: '#AAB5C7', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  errorText: { color: '#FFB1A8', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 12, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  retryText: { color: '#080C14', fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  cancelButton: { alignItems: 'center', borderColor: '#74313A', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  cancelText: { color: '#FF8995', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  backText: { color: '#AAB5C7', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, paddingVertical: 8, textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
});
