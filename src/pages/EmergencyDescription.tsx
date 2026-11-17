import { Link, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateIssueDescription } from '../helpers/validateServiceRequestDetails';
import { AttachmentPicker } from '../parts/AttachmentPicker';
import { BackButton } from '../parts/BackButton';
import { ServiceTimingModal } from '../parts/ServiceTimingModal';
import { formatServiceDate, isFutureServiceDate } from '../serviceRequests/SchedulePreferenceUtils';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';

const MAX_DESCRIPTION_LENGTH = 500;

export default function EmergencyDescription() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const {
    draft,
    setAttachments,
    setDescription: saveDescription,
    setSchedulePreference,
    setTiming,
  } = useServiceRequestDraft();
  const scrollView = useRef<ScrollViewInstance>(null);
  const scrolledToTiming = useRef(false);
  const [attempted, setAttempted] = useState(false);
  const [timingModalVisible, setTimingModalVisible] = useState(false);
  const description = draft.description;
  const error = attempted ? validateIssueDescription(description) : undefined;
  const issueError = attempted && !draft.issueType
    ? 'Select an electrical issue before continuing.'
    : '';
  const timingError = attempted && (
    !draft.timing
    || (draft.timing === 'scheduled' && !isFutureServiceDate(draft.schedulePreference?.day ?? ''))
  )
    ? 'Choose urgent service or a future preferred date.'
    : '';
  const confirmedTiming = draft.timing === 'asap'
    ? 'Urgent · As soon as possible'
    : draft.timing === 'scheduled' && draft.schedulePreference?.day
      ? `${formatServiceDate(draft.schedulePreference.day)} · Pending confirmation`
      : 'No timing selected';

  function continueRequest() {
    Keyboard.dismiss();
    setAttempted(true);
    if (
      !draft.issueType
      || validateIssueDescription(description)
      || !draft.timing
      || (draft.timing === 'scheduled' && !isFutureServiceDate(draft.schedulePreference?.day ?? ''))
    ) return;
    saveDescription(description.trim());
    router.push('/emergency-location');
  }

  function selectUrgent() {
    setTiming('asap');
    setTimingModalVisible(false);
  }

  function selectPreferredDate(date: string) {
    setTiming('scheduled');
    setSchedulePreference({ day: date, time: 'Any time' });
    setTimingModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollView} contentContainerStyle={detailStyles.content} keyboardShouldPersistTaps="handled">
          <View style={detailStyles.header}>
            <BackButton accessibilityLabel="Back" fallback="/choose-electrical-issue" textStyle={detailStyles.back}>←</BackButton>
            <Text accessibilityRole="header" style={detailStyles.title}>Tell us more</Text>
          </View>
          <Text style={detailStyles.subtitle}>Add a description, photos or video to help our technicians prepare.</Text>

          <View style={detailStyles.issueRow}>
            <Text style={detailStyles.issueValue}>{draft.issueType ?? 'No issue selected'}</Text>
            <Link href="/choose-electrical-issue?mode=edit" style={detailStyles.change}>Change</Link>
          </View>
          {!!issueError && <Text accessibilityRole="alert" style={detailStyles.error}>{issueError}</Text>}

          <View style={[detailStyles.textArea, !!error && detailStyles.invalid]}>
            <TextInput
              accessibilityLabel="Electrical problem description"
              accessibilityHint={error || 'Describe the electrical problem.'}
              value={description}
              onChangeText={(value) => saveDescription(value.slice(0, MAX_DESCRIPTION_LENGTH))}
              placeholder="Describe the issue…"
              placeholderTextColor="#7F8BA0"
              multiline
              textAlignVertical="top"
              maxLength={MAX_DESCRIPTION_LENGTH}
              style={detailStyles.input}
            />
            <Text style={detailStyles.count}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text>
          </View>
          {!!error && <Text accessibilityRole="alert" style={detailStyles.error}>{error}</Text>}

          <View style={detailStyles.attachments}>
            <AttachmentPicker value={draft.attachments} onChange={setAttachments} />
          </View>

          <View style={detailStyles.locationSection}>
            <Text style={detailStyles.locationLabel}>SERVICE LOCATION</Text>
            <View style={detailStyles.locationCard}>
              <View style={detailStyles.locationIcon}><Text style={detailStyles.locationIconText}>⌖</Text></View>
              <View style={detailStyles.locationCopy}>
                <Text style={detailStyles.locationAddress}>{draft.location?.address || 'Choose your service location'}</Text>
                <Text style={detailStyles.locationCity}>{draft.location ? `${draft.location.city}, ${draft.location.state} ${draft.location.zip}` : 'You will add this on the next step.'}</Text>
              </View>
              {draft.location && <Link href="/emergency-location" style={detailStyles.change}>Change</Link>}
            </View>
          </View>

          <View
            style={detailStyles.timingSection}
            onLayout={(event) => {
              if (section !== 'timing' || scrolledToTiming.current) return;
              scrolledToTiming.current = true;
              scrollView.current?.scrollTo({
                animated: false,
                y: Math.max(0, event.nativeEvent.layout.y - 16),
              });
            }}
          >
            <Text style={detailStyles.timingLabel}>SERVICE TIMING</Text>
            <Pressable
              accessibilityLabel={`Service timing. ${confirmedTiming}`}
              accessibilityRole="button"
              onPress={() => setTimingModalVisible(true)}
              style={({ pressed }) => [
                detailStyles.timingControl,
                !!timingError && detailStyles.invalid,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={detailStyles.timingValue}>{confirmedTiming}</Text>
              <Text style={detailStyles.timingAction}>PICK A DATE</Text>
            </Pressable>
            {!!timingError && <Text accessibilityRole="alert" style={detailStyles.error}>{timingError}</Text>}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={continueRequest}
            style={({ pressed }) => [detailStyles.continueButton, pressed && styles.buttonPressed]}
          >
            <Text style={detailStyles.continueText}>NEXT</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {timingModalVisible && (
        <ServiceTimingModal
          visible
          timing={draft.timing}
          preferredDate={draft.schedulePreference?.day}
          onClose={() => setTimingModalVisible(false)}
          onSelectDate={selectPreferredDate}
          onSelectUrgent={selectUrgent}
        />
      )}
    </SafeAreaView>
  );
}

const detailStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 26, paddingBottom: 40, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 32, marginTop: 8 },
  back: { backgroundColor: '#131B2B', borderColor: '#2D374A', borderRadius: 13, borderWidth: 1, color: '#F8FAFC', fontSize: 25, height: 52, lineHeight: 48, marginRight: 15, overflow: 'hidden', textAlign: 'center', width: 52 },
  title: { color: '#F8FAFC', flex: 1, fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#8997AC', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  issueRow: { alignItems: 'center', backgroundColor: '#0D1727', borderColor: '#263349', borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, padding: 14 },
  issueValue: { color: '#F8FAFC', flex: 1, fontSize: 15, fontWeight: '700' },
  change: { color: '#F5B900', fontSize: 12, fontWeight: '800', padding: 8 },
  textArea: { backgroundColor: '#111827', borderColor: '#3A4250', borderRadius: 16, borderWidth: 1, minHeight: 176 },
  invalid: { borderColor: '#FF6B7F' },
  input: { color: '#F8FAFC', flex: 1, fontSize: 16, lineHeight: 24, minHeight: 142, padding: 18 },
  count: { color: '#7F8BA0', fontSize: 10, paddingBottom: 10, paddingRight: 12, textAlign: 'right' },
  error: { color: '#FF9A91', fontSize: 12, marginTop: 6 },
  attachments: { marginBottom: 22, marginTop: 14 },
  locationSection: { marginBottom: 20 },
  locationLabel: { color: '#718099', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  locationCard: { alignItems: 'center', backgroundColor: '#0D1727', borderColor: '#263349', borderRadius: 14, borderWidth: 1, flexDirection: 'row', minHeight: 76, padding: 12 },
  locationIcon: { alignItems: 'center', backgroundColor: '#102A50', borderColor: '#245B9D', borderRadius: 11, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  locationIconText: { color: '#58A6FF', fontSize: 24 },
  locationCopy: { flex: 1, marginLeft: 12 },
  locationAddress: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  locationCity: { color: '#8C9AB0', fontSize: 13, marginTop: 4 },
  timingSection: { marginTop: 4 },
  timingLabel: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 9 },
  timingControl: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: 15, paddingVertical: 11 },
  timingValue: { color: '#F8FAFC', flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19, marginRight: 12 },
  timingAction: { color: '#F5B900', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  continueButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 14, justifyContent: 'center', marginTop: 16, minHeight: 64 },
  continueText: { color: '#070B13', fontSize: 15, fontWeight: '900', letterSpacing: 1.4 },
});
