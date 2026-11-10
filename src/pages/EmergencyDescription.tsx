import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateIssueDescription } from '../helpers/validateServiceRequestDetails';
import { AttachmentPicker } from '../parts/AttachmentPicker';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';

const MAX_DESCRIPTION_LENGTH = 500;

export default function EmergencyDescription() {
  const { draft, setDescription: saveDescription, setAttachments } = useServiceRequestDraft();
  const [description, setDescription] = useState(draft.description);
  const [attempted, setAttempted] = useState(false);
  const saved = !!draft.description && description === draft.description;
  const error = attempted ? validateIssueDescription(description) : undefined;

  function saveInformation() {
    Keyboard.dismiss();
    setAttempted(true);
    if (validateIssueDescription(description)) return;
    saveDescription(description.trim());
  }

  function continueRequest() {
    Keyboard.dismiss();
    setAttempted(true);
    if (!saved || validateIssueDescription(description)) return;
    router.push(draft.location ? '/review-request' : '/emergency-location');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={detailStyles.content} keyboardShouldPersistTaps="handled">
          <View style={detailStyles.header}>
            <Link href="/choose-electrical-issue" accessibilityLabel="Back to issue selection" style={detailStyles.back}>‹</Link>
            <Text accessibilityRole="header" style={detailStyles.title}>Tell us more</Text>
          </View>
          <Text style={detailStyles.subtitle}>Add a description, photos or video to help our technicians prepare.</Text>

          <View style={detailStyles.issueRow}>
            <View>
              <Text style={detailStyles.label}>SELECTED ISSUE</Text>
              <Text style={detailStyles.issueValue}>{draft.issueType ?? 'No issue selected'}</Text>
            </View>
            <Link href="/choose-electrical-issue" style={detailStyles.change}>Change</Link>
          </View>

          <View style={[detailStyles.textArea, !!error && detailStyles.invalid]}>
            <TextInput
              accessibilityLabel="Electrical problem description"
              accessibilityHint={error || 'Describe the electrical problem.'}
              value={description}
              onChangeText={(value) => setDescription(value.slice(0, MAX_DESCRIPTION_LENGTH))}
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

          <Text style={detailStyles.label}>SERVICE LOCATION</Text>
          <View style={detailStyles.locationCard}>
            <View style={detailStyles.locationIcon}><Text style={detailStyles.locationPin}>⌖</Text></View>
            <View style={detailStyles.locationCopy}>
              <Text style={detailStyles.locationTitle}>{draft.location?.address || 'Add service location'}</Text>
              <Text style={detailStyles.locationText}>
                {draft.location ? `${draft.location.city}, ${draft.location.state.toUpperCase()} ${draft.location.zip}` : 'Tell us where service is needed'}
              </Text>
            </View>
            <Link href="/emergency-location" style={detailStyles.change}>{draft.location ? 'Change' : 'Add'}</Link>
          </View>

          <Text accessibilityLiveRegion="polite" style={detailStyles.savedMessage}>
            {saved ? '✓ Information saved' : 'Save your description before continuing.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={saveInformation} style={({ pressed }) => [detailStyles.saveButton, pressed && styles.buttonPressed]}>
            <Text style={detailStyles.saveText}>SAVE INFORMATION</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !saved }}
            disabled={!saved}
            onPress={continueRequest}
            style={({ pressed }) => [detailStyles.continueButton, !saved && detailStyles.disabled, pressed && styles.buttonPressed]}
          >
            <Text style={detailStyles.continueText}>{draft.location ? 'CONTINUE TO REVIEW' : 'CONTINUE TO LOCATION'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const detailStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 22, paddingBottom: 40, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 18, marginTop: 4 },
  back: { backgroundColor: '#172033', borderRadius: 11, color: '#F8FAFC', fontSize: 30, height: 42, lineHeight: 38, marginRight: 12, overflow: 'hidden', textAlign: 'center', width: 42 },
  title: { color: '#F8FAFC', flex: 1, fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#8997AC', fontSize: 13, lineHeight: 19, marginBottom: 20 },
  issueRow: { alignItems: 'center', backgroundColor: '#0D1727', borderColor: '#263349', borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, padding: 14 },
  label: { color: '#8290A6', fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 9 },
  issueValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginTop: 4 },
  change: { color: '#F5B900', fontSize: 12, fontWeight: '800', padding: 8 },
  textArea: { backgroundColor: '#111827', borderColor: '#3A4250', borderRadius: 14, borderWidth: 1, minHeight: 150 },
  invalid: { borderColor: '#FF6B7F' },
  input: { color: '#F8FAFC', flex: 1, fontSize: 15, lineHeight: 22, minHeight: 120, padding: 14 },
  count: { color: '#7F8BA0', fontSize: 10, paddingBottom: 10, paddingRight: 12, textAlign: 'right' },
  error: { color: '#FF9A91', fontSize: 12, marginTop: 6 },
  attachments: { marginBottom: 22, marginTop: 14 },
  locationCard: { alignItems: 'center', backgroundColor: '#0D1727', borderColor: '#263349', borderRadius: 14, borderWidth: 1, flexDirection: 'row', padding: 14 },
  locationIcon: { alignItems: 'center', backgroundColor: '#102A50', borderColor: '#245B9D', borderRadius: 12, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  locationPin: { color: '#65A9FF', fontSize: 24 },
  locationCopy: { flex: 1, marginLeft: 12 },
  locationTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  locationText: { color: '#8997AC', fontSize: 11, marginTop: 4 },
  savedMessage: { color: '#9EACC1', fontSize: 12, marginTop: 16, textAlign: 'center' },
  saveButton: { alignItems: 'center', borderColor: '#F5B900', borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginTop: 12, minHeight: 50 },
  saveText: { color: '#F5B900', fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  continueButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 14, justifyContent: 'center', marginTop: 10, minHeight: 58 },
  continueText: { color: '#070B13', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  disabled: { opacity: 0.45 },
});
