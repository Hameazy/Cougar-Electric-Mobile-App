import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../parts/BackButton';
import ElectricalIssueSelector from '../parts/ElectricalIssueSelector';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';

export default function ChooseElectricalIssue() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { draft, setIssueType } = useServiceRequestDraft();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={issueStyles.content}>
        <View style={issueStyles.header}>
          <BackButton accessibilityLabel="Back" fallback="/dashboard" textStyle={issueStyles.back}>←</BackButton>
          <Text accessibilityRole="header" style={issueStyles.title}>What is the problem?</Text>
        </View>
        <Text style={issueStyles.subtitle}>Select the issue that best describes your electrical problem.</Text>
        <ElectricalIssueSelector
          selectedIssue={draft.issueType}
          onSelectIssue={(issue) => {
            setIssueType(issue);
            if (mode === 'edit') {
              if (router.canGoBack()) router.back();
              else router.replace('/emergency-description');
              return;
            }
            router.push('/emergency-description');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const issueStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 26, paddingBottom: 40, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 32, marginTop: 8 },
  back: { backgroundColor: '#131B2B', borderColor: '#2D374A', borderRadius: 13, borderWidth: 1, color: '#F8FAFC', fontSize: 25, height: 52, lineHeight: 48, marginRight: 15, overflow: 'hidden', textAlign: 'center', width: 52 },
  title: { color: '#F8FAFC', flex: 1, fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#8997AC', fontSize: 15, lineHeight: 22, marginBottom: 22 },
});
