import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSectionHeader } from '../parts/AppSectionHeader';
import { BottomNavigation } from '../parts/BottomNavigation';
import { SignedInOnly } from '../parts/SignedInOnly';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';

export default function MyJobs() {
  const [notice, setNotice] = useState('');
  const { resetDraft, setTiming } = useServiceRequestDraft();

  function scheduleJob() {
    resetDraft();
    setTiming('scheduled');
    router.push('/schedule-preference');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={jobStyles.content}>
        <AppSectionHeader eyebrow="SERVICE ACTIVITY" title="My Jobs" subtitle="View and schedule your upcoming electrical service." />
        <SignedInOnly returnTo="my-jobs">{() => (
          <View style={jobStyles.empty}>
            <Text style={jobStyles.emptyIcon}>▤</Text>
            <Text accessibilityRole="header" style={jobStyles.emptyTitle}>You do not have any jobs scheduled</Text>
            <Text style={jobStyles.emptyBody}>Choose a preferred day and time to schedule your next service appointment.</Text>
            <Pressable accessibilityRole="button" onPress={scheduleJob} style={({ pressed }) => [jobStyles.primaryButton, pressed && styles.buttonPressed]}>
              <Text style={jobStyles.primaryText}>SCHEDULE A JOB</Text>
            </Pressable>
          </View>
        )}</SignedInOnly>
        {!!notice && <Text style={jobStyles.notice}>{notice}</Text>}
      </ScrollView>
      <BottomNavigation active="My Jobs" onUnavailable={() => setNotice('Payments are coming soon.')} />
    </SafeAreaView>
  );
}

const jobStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 22, paddingBottom: 120, width: '100%' },
  notice: { color: '#AAB5C7', marginTop: 14, textAlign: 'center' },
  empty: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#353F50', borderRadius: 20, borderWidth: 1, marginTop: 26, padding: 28 },
  emptyIcon: { color: '#F5B900', fontSize: 38, marginBottom: 14 },
  emptyTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 28, textAlign: 'center' },
  emptyBody: { color: '#AAB5C7', fontSize: 14, lineHeight: 22, marginTop: 9, textAlign: 'center' },
  primaryButton: { backgroundColor: '#F5B900', borderRadius: 12, marginTop: 22, paddingHorizontal: 34, paddingVertical: 15 },
  primaryText: { color: '#080C14', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});
