import { Link, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Attachment } from '../helpers/AttachmentRules';
import { Logo } from '../parts/Logo';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { SubmitServiceRequest } from '../serviceRequests/SubmitServiceRequest';
import { withDraftDescription } from '../serviceRequests/prepareDescriptionForSubmission';
import { validateServiceRequest } from '../serviceRequests/validateServiceRequestSubmission';
import { styles } from '../styles/PageStyle';

type ReviewSectionProps = {
  title: string;
  editHref: '/dashboard' | '/schedule-preference' | '/choose-electrical-issue' | '/emergency-description' | '/emergency-location';
  editLabel: string;
  children: ReactNode;
};

function ReviewSection({ title, editHref, editLabel, children }: ReviewSectionProps) {
  return (
    <View style={reviewStyles.section}>
      <View style={reviewStyles.sectionHeader}>
        <Text accessibilityRole="header" style={reviewStyles.sectionTitle}>{title}</Text>
        <Link href={editHref} accessibilityLabel={editLabel} style={reviewStyles.editLink}>Edit</Link>
      </View>
      {children}
    </View>
  );
}

function Value({ children, missing = false }: { children: ReactNode; missing?: boolean }) {
  return <Text style={[reviewStyles.value, missing && reviewStyles.missing]}>{children}</Text>;
}

function AttachmentPreview({ file }: { file: Attachment }) {
  return (
    <View style={reviewStyles.attachment}>
      {file.kind === 'photo' ? (
        <Image source={{ uri: file.uri }} style={reviewStyles.attachmentImage} resizeMode="cover" />
      ) : (
        <View style={[reviewStyles.attachmentImage, reviewStyles.videoPreview]}>
          <Text style={reviewStyles.playIcon}>▶</Text>
        </View>
      )}
      <Text numberOfLines={1} style={reviewStyles.attachmentName}>{file.fileName}</Text>
    </View>
  );
}

export default function ReviewServiceRequest() {
  const { draft, resetDraft } = useServiceRequestDraft();
  const [submittedId, setSubmittedId] = useState('');
  const location = draft.location;
  const request = withDraftDescription(draft, {
    timing: draft.timing,
    schedulePreference: draft.schedulePreference,
    issueType: draft.issueType ?? '',
    address: location?.address ?? '',
    city: location?.city ?? '',
    state: location?.state ?? '',
    zip: location?.zip ?? '',
    latitude: location?.latitude,
    longitude: location?.longitude,
  });
  const errors = validateServiceRequest(request);
  const missingIssue = !!errors.issueType;
  const missingDescription = !!errors.description;
  const missingLocation = !!(errors.address || errors.city || errors.state || errors.zip);
  const ready = Object.keys(errors).length === 0;
  const formattedAddress = location
    ? `${location.address}\n${location.city}, ${location.state.toUpperCase()} ${location.zip}`
    : 'No service address saved';

  if (submittedId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Logo />
          <View style={[styles.card, reviewStyles.successCard]}>
            <Text style={reviewStyles.successIcon}>✓</Text>
            <Text accessibilityRole="header" style={styles.cardTitle}>Request submitted!</Text>
            <Text style={styles.subtitle}>Your service request has been received. Our team will follow up shortly.</Text>
            <Text selectable style={reviewStyles.requestId}>Request ID: {submittedId}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/choose-electrical-issue')} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>DONE</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <Link href="/emergency-location" style={styles.textLink}>← Back</Link>
          <Text style={styles.step}>FINAL STEP</Text>
        </View>
        <Logo />
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>REVIEW AND SUBMIT</Text>
          <Text accessibilityRole="header" style={styles.title}>Review your request.</Text>
          <Text style={styles.subtitle}>Make sure everything looks right before sending it to Cougar Electric.</Text>
        </View>

        <View style={reviewStyles.summaryCard}>
          <ReviewSection title="Service timing" editHref={draft.timing === 'scheduled' ? '/schedule-preference' : '/dashboard'} editLabel="Edit service timing">
            <Value>{draft.timing === 'scheduled'
              ? `Scheduled · ${draft.schedulePreference?.day ?? 'No day selected'} · ${draft.schedulePreference?.time ?? 'No time selected'}`
              : 'As soon as possible'}</Value>
          </ReviewSection>

          <ReviewSection title="Electrical issue" editHref="/choose-electrical-issue" editLabel="Edit electrical issue">
            <Value missing={missingIssue}>{draft.issueType ?? 'No issue selected'}</Value>
          </ReviewSection>

          <ReviewSection title="Problem description" editHref="/emergency-description" editLabel="Edit problem description">
            <Value missing={missingDescription}>{request.description || 'No description saved'}</Value>
          </ReviewSection>

          <ReviewSection title="Service address" editHref="/emergency-location" editLabel="Edit service address">
            <Value missing={missingLocation}>{formattedAddress}</Value>
          </ReviewSection>

          <ReviewSection title="Photos and videos" editHref="/emergency-description" editLabel="Edit photos and videos">
            {draft.attachments.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={reviewStyles.attachments}>
                {draft.attachments.map((file) => <AttachmentPreview key={file.uri} file={file} />)}
              </ScrollView>
            ) : (
              <Value>No attachments added</Value>
            )}
          </ReviewSection>
        </View>

        {!ready && (
          <View style={reviewStyles.warning}>
            <Text accessibilityRole="alert" style={reviewStyles.warningTitle}>Your request is not ready yet</Text>
            <Text style={reviewStyles.warningText}>Use the Edit links above to complete the highlighted information.</Text>
          </View>
        )}

        {ready && (
          <View style={reviewStyles.submitArea}>
            <SubmitServiceRequest request={request} files={draft.attachments} onSuccess={(id) => {
              setSubmittedId(id);
              resetDraft();
            }} />
            <Text style={styles.footerNote}>By submitting, you confirm that the information above is accurate.</Text>
          </View>
        )}

        <Text style={styles.footer}>COUGAR ELECTRIC INC.  ·  EMERGENCY REQUEST</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const reviewStyles = StyleSheet.create({
  summaryCard: { backgroundColor: 'rgba(18, 23, 33, 0.94)', borderColor: '#353B46', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  section: { borderBottomColor: '#303744', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingVertical: 20 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#F5B900', fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' },
  editLink: { color: '#8ABEFF', fontSize: 13, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 6 },
  value: { color: '#F8FAFC', fontSize: 16, lineHeight: 24 },
  missing: { color: '#FFB1A8' },
  attachments: { gap: 10, paddingRight: 8 },
  attachment: { width: 104 },
  attachmentImage: { backgroundColor: '#0A101B', borderColor: '#3A4250', borderRadius: 12, borderWidth: 1, height: 82, width: 104 },
  videoPreview: { alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#F5B900', fontSize: 24 },
  attachmentName: { color: '#AAB5C7', fontSize: 11, marginTop: 6 },
  warning: { backgroundColor: '#301B20', borderColor: '#74313A', borderRadius: 14, borderWidth: 1, marginTop: 18, padding: 16 },
  warningTitle: { color: '#FFB1A8', fontSize: 15, fontWeight: '700' },
  warningText: { color: '#D5A6A1', fontSize: 13, lineHeight: 20, marginTop: 5 },
  submitArea: { marginTop: 18 },
  successCard: { alignItems: 'center', marginTop: 28 },
  successIcon: { color: '#F5B900', fontSize: 42, fontWeight: '800', marginBottom: 12 },
  requestId: { color: '#F5B900', fontSize: 13, fontWeight: '700', marginVertical: 20 },
});
