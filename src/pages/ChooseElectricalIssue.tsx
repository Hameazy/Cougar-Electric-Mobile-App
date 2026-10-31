import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ElectricalIssueSelector from '../parts/ElectricalIssueSelector';
import { canContinueWithIssue } from '../serviceRequests/validateIssueSelection';
import { Logo } from '../parts/Logo';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';

export default function ChooseElectricalIssue() {
  const { draft, setIssueType } = useServiceRequestDraft();
  const canContinue = canContinueWithIssue(draft);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Logo />
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SERVICE REQUEST</Text>
          <Text accessibilityRole="header" style={styles.title}>Tell us what’s wrong.</Text>
        </View>
        <View style={styles.card}>
          <ElectricalIssueSelector selectedIssue={draft.issueType} onSelectIssue={(issue) => {
            setIssueType(issue);
            if (issue === 'Other electrical issue') router.push('/emergency-description');
          }} />
          {draft.issueType && draft.issueType !== 'Other electrical issue' && (
            <Link href="/emergency-description" style={[styles.textLink, { marginTop: 20 }]}>Add or edit details →</Link>
          )}
          {!canContinue && <Text style={styles.cardSubtitle}>{draft.issueType ? 'Save a description for Other electrical issue before continuing.' : 'Choose an electrical issue before continuing.'}</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next: choose location"
            accessibilityState={{ disabled: !canContinue }}
            disabled={!canContinue}
            onPress={() => router.push('/emergency-location')}
            style={({ pressed }) => [styles.button, { marginTop: 24, minHeight: 56 }, !canContinue && { opacity: 0.5 }, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>NEXT: CHOOSE LOCATION  →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
