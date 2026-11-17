import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';
import { useAuthSession } from '../helpers/useAuthSession';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications';
import { CustomerMenu } from '../parts/CustomerMenu';
import { ElectricalIssueIcon } from '../parts/ElectricalIssueIcon';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';
import { styles } from '../styles/PageStyle';
import { Logo } from '../parts/Logo';

const SERVICE_CARDS: { icon: string; label: string; issue?: ElectricalIssue }[] = [
  { icon: '⌂', label: 'Residential\nService' },
  { icon: '▥', label: 'Commercial\nService' },
  { icon: '◩', label: 'Industrial\nService' },
  { icon: 'Ψ', label: 'EV Charger\nInstallation', issue: 'EV charger issue' },
  { icon: '⚒', label: 'Electrical\nRepairs', issue: 'Other' },
  { icon: '◉', label: 'Lighting\nSolutions', issue: 'Lighting issue' },
];

function NotificationBell({ hasUnread }: { hasUnread: boolean }) {
  return (
    <View accessible={false} style={dashboardStyles.bell}>
      <View style={dashboardStyles.bellDome} />
      <View style={dashboardStyles.bellBase} />
      <View style={dashboardStyles.bellClapper} />
      {hasUnread && <View style={dashboardStyles.notificationDot} />}
    </View>
  );
}

export default function CustomerDashboard() {
  const { resetDraft, setIssueType, setTiming } = useServiceRequestDraft();
  const { user } = useAuthSession();
  const { notifications } = useCustomerNotifications(user?.id);
  const [menuOpen, setMenuOpen] = useState(false);

  function startRequest(issue?: ElectricalIssue, timing?: 'asap' | 'scheduled') {
    resetDraft();
    if (timing) setTiming(timing);
    if (issue) setIssueType(issue);
    router.push(issue ? '/emergency-description' : '/choose-electrical-issue');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={dashboardStyles.content}>
        <View style={dashboardStyles.topbar}>
          <Pressable accessibilityLabel="Open menu" accessibilityRole="button" onPress={() => setMenuOpen(true)} style={dashboardStyles.topIcon}>
            <Text style={dashboardStyles.menuIcon}>☰</Text>
          </Pressable>
          <Pressable accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => router.push('/notifications')} style={dashboardStyles.topIcon}>
            <NotificationBell hasUnread={notifications.length > 0} />
          </Pressable>
        </View>

        <Logo />

        <View style={dashboardStyles.hero}>
          <View pointerEvents="none" style={dashboardStyles.heroGraphic}>
            <View style={dashboardStyles.heroRail} />
            <View style={dashboardStyles.heroWindows}>
              <View style={dashboardStyles.heroWindow} />
              <View style={dashboardStyles.heroWindow} />
              <View style={dashboardStyles.heroWindow} />
            </View>
            <View style={dashboardStyles.heroRail} />
          </View>
          <Text accessibilityRole="header" style={dashboardStyles.heroTitle}>Electrical{`\n`}Service When{`\n`}You Need It.</Text>
          <Text style={dashboardStyles.heroSubtitle}>Reliable. Professional. Local.</Text>
        </View>

        <View style={dashboardStyles.primaryActions}>
          <Pressable accessibilityRole="button" onPress={() => startRequest(undefined, 'asap')} style={({ pressed }) => [dashboardStyles.requestButton, pressed && styles.buttonPressed]}>
            <Text style={dashboardStyles.requestIcon}>ϟ</Text>
            <Text style={dashboardStyles.requestText}>REQUEST ELECTRICIAN NOW</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => startRequest(undefined, 'scheduled')} style={({ pressed }) => [dashboardStyles.scheduleButton, pressed && styles.buttonPressed]}>
            <Text style={dashboardStyles.scheduleIcon}>▣</Text>
            <Text style={dashboardStyles.scheduleText}>SCHEDULE SERVICE</Text>
          </Pressable>
        </View>

        <View style={dashboardStyles.shortcuts}>
          <View style={dashboardStyles.serviceGrid}>
            {SERVICE_CARDS.map((service) => (
              <Pressable
                key={service.label}
                accessibilityLabel={`Start a ${service.label.replace('\n', ' ').toLowerCase()} request`}
                accessibilityRole="button"
                onPress={() => startRequest(service.issue)}
                style={({ pressed }) => [dashboardStyles.serviceCard, pressed && styles.buttonPressed]}
              >
                {service.issue === 'EV charger issue' || service.issue === 'Lighting issue' ? (
                  <ElectricalIssueIcon color="#F8FAFC" issue={service.issue} size={31} />
                ) : (
                  <Text accessible={false} style={dashboardStyles.serviceIcon}>{service.icon}</Text>
                )}
                <Text style={dashboardStyles.serviceLabel}>{service.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => startRequest()}
            style={({ pressed }) => [dashboardStyles.viewAllButton, pressed && styles.buttonPressed]}
          >
            <Text style={dashboardStyles.viewAllText}>VIEW ALL ELECTRICAL PROBLEMS</Text>
            <Text accessible={false} style={dashboardStyles.viewAllChevron}>›</Text>
          </Pressable>
        </View>

      </ScrollView>
      <CustomerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onRequestService={() => startRequest()} />
    </SafeAreaView>
  );
}

const dashboardStyles = StyleSheet.create({
  content: { alignSelf: 'center', flexGrow: 1, gap: 18, maxWidth: 600, paddingHorizontal: 28, paddingBottom: 26, paddingTop: 14, width: '100%' },
  topbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topIcon: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  menuIcon: { color: '#F8FAFC', fontSize: 25 },
  bell: { height: 30, position: 'relative', width: 28 },
  bellDome: { borderColor: '#F8FAFC', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 2.5, bottom: 8, height: 16, left: 6, position: 'absolute', width: 16 },
  bellBase: { backgroundColor: '#F8FAFC', borderRadius: 2, bottom: 6, height: 2.5, left: 3, position: 'absolute', width: 22 },
  bellClapper: { backgroundColor: '#F8FAFC', borderBottomLeftRadius: 5, borderBottomRightRadius: 5, bottom: 1, height: 4, left: 11, position: 'absolute', width: 6 },
  notificationDot: { backgroundColor: '#FF526A', borderColor: '#07101F', borderRadius: 5, borderWidth: 1.5, height: 10, position: 'absolute', right: 2, top: 5, width: 10 },
  hero: { minHeight: 244, overflow: 'hidden', paddingVertical: 18 },
  heroGraphic: { opacity: 0.25, position: 'absolute', right: -8, top: 72, width: '72%' },
  heroRail: { backgroundColor: '#26426D', height: 13, marginVertical: 12 },
  heroWindows: { flexDirection: 'row', gap: 22, height: 70, justifyContent: 'flex-end' },
  heroWindow: { backgroundColor: '#C79416', width: 54 },
  heroTitle: { color: '#FFFFFF', fontSize: 46, fontWeight: '900', letterSpacing: -1.7, lineHeight: 51 },
  heroSubtitle: { color: '#C4CDDA', fontSize: 17, marginTop: 15 },
  primaryActions: { gap: 12 },
  requestButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 17, flexDirection: 'row', justifyContent: 'center', minHeight: 68, paddingHorizontal: 18 },
  requestIcon: { color: '#07101F', fontSize: 26, marginRight: 16 },
  requestText: { color: '#07101F', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  scheduleButton: { alignItems: 'center', borderColor: '#4A5363', borderRadius: 17, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 62, paddingHorizontal: 18 },
  scheduleIcon: { color: '#F8FAFC', fontSize: 21, marginRight: 16 },
  scheduleText: { color: '#F8FAFC', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  shortcuts: { gap: 12 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: { alignItems: 'center', backgroundColor: 'rgba(17, 23, 34, 0.88)', borderColor: '#414957', borderRadius: 18, borderWidth: 1.2, flexBasis: '30%', flexGrow: 1, justifyContent: 'center', minHeight: 136, minWidth: 86, padding: 10 },
  serviceIcon: { color: '#F8FAFC', fontSize: 34, fontWeight: '500', lineHeight: 38 },
  serviceLabel: { color: '#E6EBF2', fontSize: 13, fontWeight: '800', lineHeight: 18, marginTop: 11, textAlign: 'center' },
  viewAllButton: { alignItems: 'center', borderColor: '#4A5363', borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 52, paddingHorizontal: 42 },
  viewAllText: { color: '#F8FAFC', fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center' },
  viewAllChevron: { color: '#D7DFEC', fontSize: 26, position: 'absolute', right: 16 },
});
