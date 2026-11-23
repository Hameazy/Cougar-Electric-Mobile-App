import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSectionHeader } from '../parts/AppSectionHeader';
import { ActiveJobsOverview } from '../parts/ActiveJobsOverview';
import { SignedInOnly } from '../parts/SignedInOnly';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';

export default function MyJobs() {
  const { resetDraft } = useServiceRequestDraft();

  function scheduleJob() {
    resetDraft();
    router.push('/choose-electrical-issue');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={jobStyles.content}>
        <AppSectionHeader eyebrow="SERVICE ACTIVITY" title="My Jobs" subtitle="View and schedule your upcoming electrical service." />
        <SignedInOnly returnTo="my-jobs">{(user) => (
          <ActiveJobsOverview user={user} onScheduleJob={scheduleJob} />
        )}</SignedInOnly>
      </ScrollView>
    </SafeAreaView>
  );
}

const jobStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 22, paddingBottom: 40, width: '100%' },
});
