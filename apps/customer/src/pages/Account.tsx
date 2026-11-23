import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService, getAuthErrorMessage } from '../auth/FirebaseAuthenticationService';
import { getCustomerProfile, type CustomerProfile } from '../helpers/CustomerProfile';
import { useAuthSession } from '../helpers/useAuthSession';
import { ErrorBanner } from '../parts/ErrorBanner';
import { styles } from '../styles/PageStyle';
import SignIn from './SignIn';

type SettingKey = 'profile' | 'address' | 'payment' | 'notifications' | 'security' | 'privacy' | 'about' | null;

export default function Account() {
  const { user, loading } = useAuthSession();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [openSetting, setOpenSetting] = useState<SettingKey>(null);
  const [serviceUpdates, setServiceUpdates] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    getCustomerProfile(user.id)
      .then(setProfile)
      .catch(() => setErrorMessage('Your profile details could not be loaded.'));
  }, [user]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setErrorMessage('');
    try {
      await authService.signOut();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, accountStyles.loading]}><ActivityIndicator color="#F5B900" /></SafeAreaView>;
  }
  if (!user) return <SignIn accountTab />;

  const displayName = profile?.fullName || user.fullName || 'Cougar Electric Customer';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={accountStyles.content}>
        <Text style={accountStyles.eyebrow}>ACCOUNT SETTINGS</Text>
        <Text accessibilityRole="header" style={accountStyles.title}>Your account</Text>

        <View style={accountStyles.identityCard}>
          <View style={accountStyles.avatar}><Text style={accountStyles.avatarText}>{initials(displayName)}</Text></View>
          <View style={accountStyles.identityCopy}>
            <Text style={accountStyles.name}>{displayName}</Text>
            <Text numberOfLines={1} style={accountStyles.email}>{user.email}</Text>
          </View>
          <View style={accountStyles.signedIn}><Text style={accountStyles.signedInText}>SIGNED IN</Text></View>
        </View>

        <ErrorBanner message={errorMessage} />

        <Text style={accountStyles.sectionLabel}>ACCOUNT</Text>
        <View style={accountStyles.group}>
          <SettingRow icon="♙" label="Personal information" detail="Name, email and phone" onPress={() => toggle('profile', openSetting, setOpenSetting)} />
          {openSetting === 'profile' && <DetailPanel rows={[
            ['Full name', displayName],
            ['Email', user.email],
            ['Phone', profile?.phone || 'No phone number saved'],
          ]} />}
          <SettingRow icon="⌖" label="Saved address" detail="Your default service location" onPress={() => toggle('address', openSetting, setOpenSetting)} />
          {openSetting === 'address' && <DetailPanel rows={[
            ['Street', profile?.address || 'No address saved'],
            ['City', formatCity(profile)],
          ]} />}
          <SettingRow icon="▭" label="Payment methods" detail="Manage cards and billing" onPress={() => toggle('payment', openSetting, setOpenSetting)} />
          {openSetting === 'payment' && <DetailPanel rows={[["Payment method", 'No saved payment method']]} />}
        </View>

        <Text style={accountStyles.sectionLabel}>PREFERENCES</Text>
        <View style={accountStyles.group}>
          <SettingRow icon="♢" label="Notifications" detail="Service and message alerts" onPress={() => toggle('notifications', openSetting, setOpenSetting)} />
          {openSetting === 'notifications' && (
            <View style={accountStyles.preferencePanel}>
              <ToggleRow label="Service request updates" value={serviceUpdates} onChange={setServiceUpdates} />
              <ToggleRow label="New message alerts" value={messageAlerts} onChange={setMessageAlerts} />
              <ToggleRow label="Offers and announcements" value={promotions} onChange={setPromotions} />
            </View>
          )}
          <SettingRow icon="⌑" label="Password and security" detail="Password and account access" onPress={() => toggle('security', openSetting, setOpenSetting)} />
          {openSetting === 'security' && (
            <View style={accountStyles.actionPanel}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/forgot-password')} style={accountStyles.outlineAction}><Text style={accountStyles.outlineActionText}>RESET PASSWORD</Text></Pressable>
            </View>
          )}
          <SettingRow icon="◎" label="Privacy" detail="Account and data information" onPress={() => toggle('privacy', openSetting, setOpenSetting)} />
          {openSetting === 'privacy' && <View style={accountStyles.actionPanel}><Text style={accountStyles.panelText}>Your account information is used to provide service, communicate about your requests, and process payments.</Text></View>}
        </View>

        <Text style={accountStyles.sectionLabel}>SUPPORT</Text>
        <View style={accountStyles.group}>
          <SettingRow icon="?" label="Help and support" detail="Contact Cougar Electric" onPress={() => router.push('/messages')} />
          <SettingRow icon="i" label="About Cougar Electric" detail="Application information" onPress={() => toggle('about', openSetting, setOpenSetting)} />
          {openSetting === 'about' && <View style={accountStyles.actionPanel}><Text style={accountStyles.panelText}>Cougar Electric connects customers with electrical service, job updates, messages, and account tools in one place.</Text></View>}
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{ busy: signingOut, disabled: signingOut }} disabled={signingOut} onPress={() => void signOut()} style={({ pressed }) => [accountStyles.signOutButton, pressed && styles.buttonPressed, signingOut && accountStyles.disabled]}>
          {signingOut ? <ActivityIndicator color="#FF9A91" /> : <Text style={accountStyles.signOutText}>SIGN OUT</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ detail, icon, label, onPress }: { detail: string; icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [accountStyles.row, pressed && accountStyles.rowPressed]}>
      <View style={accountStyles.rowIcon}><Text style={accountStyles.rowIconText}>{icon}</Text></View>
      <View style={accountStyles.rowCopy}><Text style={accountStyles.rowLabel}>{label}</Text><Text style={accountStyles.rowDetail}>{detail}</Text></View>
      <Text style={accountStyles.chevron}>›</Text>
    </Pressable>
  );
}

function DetailPanel({ rows }: { rows: [string, string][] }) {
  return <View style={accountStyles.detailPanel}>{rows.map(([label, value]) => <View key={label} style={accountStyles.detailLine}><Text style={accountStyles.detailLabel}>{label}</Text><Text style={accountStyles.detailValue}>{value}</Text></View>)}</View>;
}

function ToggleRow({ label, onChange, value }: { label: string; onChange: (value: boolean) => void; value: boolean }) {
  return <View style={accountStyles.toggleRow}><Text style={accountStyles.toggleLabel}>{label}</Text><Switch accessibilityLabel={label} onValueChange={onChange} trackColor={{ false: '#374257', true: '#9A7500' }} thumbColor={value ? '#F5B900' : '#A8B1BF'} value={value} /></View>;
}

function toggle(key: Exclude<SettingKey, null>, current: SettingKey, set: (key: SettingKey) => void) {
  set(current === key ? null : key);
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CE';
}

function formatCity(profile: CustomerProfile | null) {
  if (!profile || (!profile.city && !profile.state && !profile.zip)) return 'No city saved';
  return `${profile.city}${profile.city && profile.state ? ', ' : ''}${profile.state} ${profile.zip}`.trim();
}

const accountStyles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center' },
  content: { alignSelf: 'center', maxWidth: 600, padding: 22, paddingBottom: 42, width: '100%' },
  eyebrow: { color: '#F5B900', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 12 },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: 9 },
  identityCard: { alignItems: 'center', backgroundColor: '#111A2A', borderColor: '#334056', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 13, marginTop: 24, padding: 17 },
  avatar: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 25, height: 50, justifyContent: 'center', width: 50 },
  avatarText: { color: '#07101F', fontSize: 15, fontWeight: '900' },
  identityCopy: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  email: { color: '#98A5B8', fontSize: 12, marginTop: 4 },
  signedIn: { backgroundColor: '#0E3328', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  signedInText: { color: '#55D68B', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  sectionLabel: { color: '#8290A6', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 9, marginTop: 25 },
  group: { backgroundColor: '#111A2A', borderColor: '#334056', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', borderBottomColor: '#2A3548', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 68, paddingHorizontal: 14 },
  rowPressed: { backgroundColor: '#152139' },
  rowIcon: { alignItems: 'center', backgroundColor: '#152642', borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  rowIconText: { color: '#F5B900', fontSize: 19, fontWeight: '700' },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowLabel: { color: '#F5F7FB', fontSize: 14, fontWeight: '800' },
  rowDetail: { color: '#8290A6', fontSize: 11, marginTop: 4 },
  chevron: { color: '#8593A9', fontSize: 26 },
  detailPanel: { backgroundColor: '#0C1524', borderBottomColor: '#2A3548', borderBottomWidth: StyleSheet.hairlineWidth, padding: 15 },
  detailLine: { flexDirection: 'row', gap: 14, justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { color: '#8290A6', fontSize: 12 },
  detailValue: { color: '#E8EDF4', flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  preferencePanel: { backgroundColor: '#0C1524', paddingHorizontal: 15 },
  toggleRow: { alignItems: 'center', borderBottomColor: '#263247', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 56 },
  toggleLabel: { color: '#E8EDF4', flex: 1, fontSize: 13, fontWeight: '600' },
  actionPanel: { backgroundColor: '#0C1524', padding: 15 },
  outlineAction: { alignItems: 'center', borderColor: '#F5B900', borderRadius: 10, borderWidth: 1, padding: 13 },
  outlineActionText: { color: '#F5B900', fontSize: 11, fontWeight: '900' },
  panelText: { color: '#AAB5C7', fontSize: 12, lineHeight: 19 },
  signOutButton: { alignItems: 'center', borderColor: '#74313A', borderRadius: 13, borderWidth: 1, justifyContent: 'center', marginTop: 26, minHeight: 52 },
  signOutText: { color: '#FF9A91', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  disabled: { opacity: 0.6 },
});
