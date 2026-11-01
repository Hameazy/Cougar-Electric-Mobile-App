import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../parts/Logo';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { SubmitServiceRequest } from '../serviceRequests/SubmitServiceRequest';
import { withDraftDescription } from '../serviceRequests/prepareDescriptionForSubmission';
import { validateServiceRequest } from '../serviceRequests/validation';
import { styles } from '../styles/PageStyle';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.cardSubtitle}>{value || 'Not provided'}</Text>
    </View>
  );
}

export default function ReviewServiceRequest() {
  const { draft, resetDraft } = useServiceRequestDraft();
  const location = draft.location;
  const request = withDraftDescription(draft, {
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
  const ready = !missingIssue && !missingDescription && !missingLocation;
  const [submittedId, setSubmittedId] = useState('');

  if (submittedId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Logo />
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>Request submitted!</Text>
            <Text style={styles.cardSubtitle}>Your emergency service request has been received. Our team will follow up shortly.</Text>
            <Text selectable style={[styles.cardSubtitle, { marginTop: 12 }]}>Request ID: {submittedId}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/choose-electrical-issue')}
              style={({ pressed }) => [styles.button, { marginTop: 24 }, pressed && styles.buttonPressed]}
            >
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
          <Text accessibilityRole="header" style={styles.title}>Confirm your request.</Text>
          <Text style={styles.subtitle}>Check the details below, then send your emergency service request.</Text>
        </View>
        <View style={styles.card}>
          <Row label="ISSUE" value={draft.issueType ?? ''} />
          <Row label="DESCRIPTION" value={request.description} />
          <Row
            label="SERVICE ADDRESS"
            value={location ? `${location.address}, ${location.city}, ${location.state.toUpperCase()} ${location.zip}` : ''}
          />
          <Row
            label="PHOTOS / VIDEOS"
            value={draft.attachments.length ? draft.attachments.map((file) => file.fileName).join(', ') : 'None attached'}
          />

          {!ready && (
            <View>
              <Text accessibilityLiveRegion="polite" style={[styles.cardSubtitle, { marginBottom: 12 }]}>
                Complete the missing information before submitting.
              </Text>
              {missingIssue && <Link href="/choose-electrical-issue" style={styles.textLink}>Choose an issue →</Link>}
              {missingDescription && <Link href="/emergency-description" style={styles.textLink}>Add a description →</Link>}
              {missingLocation && <Link href="/emergency-location" style={styles.textLink}>Add the service location →</Link>}
            </View>
          )}

          {ready && (
            <SubmitServiceRequest
              request={request}
              files={draft.attachments}
              onSuccess={(id) => {
                setSubmittedId(id);
                resetDraft();
              }}
            />
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/choose-electrical-issue')}
            style={({ pressed }) => [styles.locationButton, { marginTop: 16 }, pressed && styles.buttonPressed]}
          >
            <Text style={styles.locationButtonText}>START A NEW REQUEST</Text>
          </Pressable>
        </View>
        <Text style={styles.footer}>COUGAR ELECTRIC INC.  ·  EMERGENCY REQUEST</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
