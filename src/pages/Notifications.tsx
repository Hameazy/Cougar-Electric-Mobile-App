import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '../helpers/useAuthSession';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications';
import { styles } from '../styles/PageStyle';

export default function Notifications() {
  const { user, loading: loadingUser } = useAuthSession();
  const { notifications, loading, errorMessage } = useCustomerNotifications(user?.id);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={notificationStyles.content}>
        <View style={notificationStyles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={notificationStyles.backButton}>
            <Text style={notificationStyles.backText}>‹</Text>
          </Pressable>
          <Text accessibilityRole="header" style={notificationStyles.title}>Notifications</Text>
          <View style={notificationStyles.headerSpacer} />
        </View>

        {(loadingUser || loading) ? (
          <View style={notificationStyles.loading}><ActivityIndicator color="#F5B900" /></View>
        ) : errorMessage ? (
          <View style={notificationStyles.errorCard}><Text accessibilityRole="alert" style={notificationStyles.errorText}>{errorMessage}</Text></View>
        ) : notifications.length > 0 ? (
          <View style={notificationStyles.list}>
            <Text style={notificationStyles.sectionLabel}>NEW</Text>
            {notifications.map((notification) => (
              <Pressable key={notification.id} accessibilityRole="button" onPress={() => router.push('/messages')} style={({ pressed }) => [notificationStyles.notification, pressed && styles.buttonPressed]}>
                <View style={notificationStyles.messageIcon}><Text style={notificationStyles.messageIconText}>○</Text></View>
                <View style={notificationStyles.copy}>
                  <Text style={notificationStyles.notificationTitle}>{notification.title}</Text>
                  <Text numberOfLines={3} style={notificationStyles.message}>{notification.message}</Text>
                </View>
                <View style={notificationStyles.unreadDot} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={notificationStyles.empty}>
            <View style={notificationStyles.bell}><Text style={notificationStyles.bellText}>♢</Text></View>
            <Text style={notificationStyles.emptyTitle}>No current notifications</Text>
            <Text style={notificationStyles.emptyBody}>{user ? 'New messages and service updates will appear here.' : 'Sign in to see messages and service updates for your account.'}</Text>
            {!user && <Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={notificationStyles.signIn}><Text style={notificationStyles.signInText}>SIGN IN</Text></Pressable>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const notificationStyles = StyleSheet.create({
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 600, padding: 22, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 28 },
  backButton: { alignItems: 'center', backgroundColor: '#111A2A', borderColor: '#334056', borderRadius: 12, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  backText: { color: '#FFFFFF', fontSize: 32, lineHeight: 34, marginTop: -3 },
  title: { color: '#FFFFFF', flex: 1, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 44 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 350 },
  errorCard: { backgroundColor: '#301B20', borderColor: '#74313A', borderRadius: 14, borderWidth: 1, padding: 16 },
  errorText: { color: '#FFB1A8', fontSize: 13, textAlign: 'center' },
  list: { gap: 12 },
  sectionLabel: { color: '#F5B900', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  notification: { alignItems: 'center', backgroundColor: '#111A2A', borderColor: '#334056', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 13, padding: 16 },
  messageIcon: { alignItems: 'center', backgroundColor: '#102A4E', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  messageIconText: { color: '#58A8FF', fontSize: 25 },
  copy: { flex: 1 },
  notificationTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  message: { color: '#AAB5C7', fontSize: 13, lineHeight: 19, marginTop: 5 },
  unreadDot: { backgroundColor: '#FF526A', borderRadius: 5, height: 10, width: 10 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 430, paddingHorizontal: 24 },
  bell: { alignItems: 'center', backgroundColor: '#152139', borderRadius: 38, height: 76, justifyContent: 'center', width: 76 },
  bellText: { color: '#F5B900', fontSize: 42 },
  emptyTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 22 },
  emptyBody: { color: '#98A5B8', fontSize: 14, lineHeight: 21, marginTop: 9, textAlign: 'center' },
  signIn: { backgroundColor: '#F5B900', borderRadius: 12, marginTop: 24, paddingHorizontal: 48, paddingVertical: 14 },
  signInText: { color: '#07101F', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
