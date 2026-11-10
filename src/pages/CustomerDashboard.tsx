import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';
import { authService, getAuthErrorMessage } from '../auth/FirebaseAuthenticationService';
import { useAuthSession } from '../helpers/useAuthSession';
import { Logo } from '../parts/Logo';
import { BottomNavigation } from '../parts/BottomNavigation';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';
import type { RequestTiming } from '../serviceRequests/ServiceRequestTypes';

const SERVICES: { icon: string; label: string; issue: ElectricalIssue }[] = [
  { icon: '♧', label: 'EV Charger\nInstallation', issue: 'EV charger issue' },
  { icon: '⚿', label: 'Electrical\nRepairs', issue: 'Other' },
  { icon: '●', label: 'Lighting\nSolutions', issue: 'Lighting issue' },
];

export default function CustomerDashboard() {
  const { resetDraft, setIssueType, setTiming } = useServiceRequestDraft();
  const { user } = useAuthSession();
  const [notice, setNotice] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  function startRequest({ timing = 'asap', issue }: { timing?: RequestTiming; issue?: ElectricalIssue } = {}) {
    resetDraft();
    setTiming(timing);
    if (issue) setIssueType(issue);
    if (timing === 'scheduled') router.push('/schedule-preference');
    else router.push(issue ? '/emergency-description' : '/choose-electrical-issue');
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authService.signOut();
      setNotice('You have been signed out.');
    } catch (error) {
      setNotice(getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={dashboardStyles.content}>
        <View style={dashboardStyles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={() => setNotice('Your customer menu is coming soon.')} style={dashboardStyles.iconButton}>
            <Text style={dashboardStyles.menuIcon}>☰</Text>
          </Pressable>
          <View style={dashboardStyles.headerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => setNotice('You have no new notifications.')} style={dashboardStyles.iconButton}>
              <Text style={dashboardStyles.bell}>♧</Text>
            </Pressable>
            {user && (
              <Pressable accessibilityRole="button" accessibilityLabel="Sign out" accessibilityState={{ busy: signingOut, disabled: signingOut }} disabled={signingOut} onPress={() => void signOut()} style={dashboardStyles.signOutButton}>
                <Text style={dashboardStyles.signOutText}>{signingOut ? '…' : 'SIGN OUT'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Logo />

        <View style={dashboardStyles.hero}>
          <Text accessibilityRole="header" style={dashboardStyles.heroTitle}>Electrical Service When You Need It.</Text>
          <Text style={dashboardStyles.heroSubtitle}>Reliable. Professional. Local.</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => startRequest({ timing: 'asap' })} style={({ pressed }) => [dashboardStyles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={dashboardStyles.bolt}>ϟ</Text>
          <Text style={dashboardStyles.primaryText}>REQUEST ELECTRICIAN NOW</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => startRequest({ timing: 'scheduled' })} style={({ pressed }) => [dashboardStyles.secondaryButton, pressed && styles.buttonPressed]}>
          <Text style={dashboardStyles.calendar}>▣</Text>
          <Text style={dashboardStyles.secondaryText}>SCHEDULE SERVICE</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Nearby technician map coming soon"
          onPress={() => setNotice('The nearby technician map is coming soon.')}
          style={({ pressed }) => [dashboardStyles.nearbyButton, pressed && styles.buttonPressed]}
        >
          <Text style={dashboardStyles.nearbyIcon}>⌖</Text>
          <View style={dashboardStyles.nearbyCopy}>
            <Text style={dashboardStyles.nearbyText}>FIND NEARBY TECHNICIANS</Text>
            <Text style={dashboardStyles.nearbySubtext}>View available electricians near you</Text>
          </View>
          <Text style={dashboardStyles.chevron}>›</Text>
        </Pressable>

        {!!notice && <View style={dashboardStyles.notice}><Text accessibilityLiveRegion="polite" style={dashboardStyles.noticeText}>{notice}</Text></View>}

        <View style={dashboardStyles.serviceGrid}>
          {SERVICES.map((service) => (
            <Pressable key={service.label} accessibilityRole="button" onPress={() => startRequest({ issue: service.issue })} style={({ pressed }) => [dashboardStyles.serviceCard, pressed && styles.buttonPressed]}>
              <Text style={dashboardStyles.serviceIcon}>{service.icon}</Text>
              <Text style={dashboardStyles.serviceLabel}>{service.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNavigation active="Home" onUnavailable={(label) => setNotice(`${label} is coming soon.`)} />
    </SafeAreaView>
  );
}

const dashboardStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 22, paddingBottom: 120, width: '100%' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  menuIcon: { color: '#F8FAFC', fontSize: 25 },
  bell: { color: '#F8FAFC', fontSize: 24 },
  signOutButton: { borderColor: '#4A5363', borderRadius: 10, borderWidth: 1, justifyContent: 'center', minHeight: 36, paddingHorizontal: 11 },
  signOutText: { color: '#D7DFEA', fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  hero: { marginVertical: 24 },
  heroTitle: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', letterSpacing: -1.2, lineHeight: 43, maxWidth: 390 },
  heroSubtitle: { color: '#C5CEDB', fontSize: 16, marginTop: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', minHeight: 64 },
  primaryText: { color: '#080C14', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  bolt: { color: '#080C14', fontSize: 28, marginRight: 16 },
  secondaryButton: { alignItems: 'center', borderColor: '#4A5363', borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 12, minHeight: 60 },
  secondaryText: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  calendar: { color: '#F8FAFC', fontSize: 21, marginRight: 16 },
  nearbyButton: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginTop: 12, minHeight: 68, paddingHorizontal: 16 },
  nearbyIcon: { color: '#F5B900', fontSize: 27, marginRight: 14 },
  nearbyCopy: { flex: 1 },
  nearbyText: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', letterSpacing: 0.7 },
  nearbySubtext: { color: '#8290A6', fontSize: 12, marginTop: 4 },
  chevron: { color: '#8290A6', fontSize: 28, marginLeft: 10 },
  notice: { backgroundColor: '#132039', borderColor: '#29466E', borderRadius: 12, borderWidth: 1, marginTop: 14, padding: 12 },
  noticeText: { color: '#AFC4E2', fontSize: 13, textAlign: 'center' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  serviceCard: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 132, padding: 12, width: '31%' },
  serviceIcon: { color: '#F8FAFC', fontSize: 28, marginBottom: 13 },
  serviceLabel: { color: '#E6EBF2', fontSize: 13, fontWeight: '700', lineHeight: 18, textAlign: 'center' },
});
