import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthSession } from '../helpers/useAuthSession';
import { styles } from '../styles/PageStyle';

type CustomerMenuProps = {
  onClose: () => void;
  onRequestService: () => void;
  visible: boolean;
};

const ITEMS = [
  { icon: '⌂', label: 'Home', path: '/dashboard' as const },
  { icon: '▤', label: 'My Jobs', path: '/my-jobs' as const },
  { icon: '○', label: 'Messages', path: '/messages' as const },
  { icon: '▭', label: 'Payments', path: '/payments' as const },
  { icon: '♢', label: 'Notifications', path: '/notifications' as const },
  { icon: '⚙', label: 'Settings', path: '/account' as const },
];

export function CustomerMenu({ onClose, onRequestService, visible }: CustomerMenuProps) {
  const { user } = useAuthSession();

  function navigate(path: (typeof ITEMS)[number]['path']) {
    onClose();
    router.push(path);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={menuStyles.overlay}>
        <Pressable accessibilityLabel="Close customer menu" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={menuStyles.drawer}>
          <View style={menuStyles.header}>
            <View style={menuStyles.avatar}><Text style={menuStyles.avatarText}>{initials(user?.fullName || user?.email)}</Text></View>
            <View style={menuStyles.headerCopy}>
              <Text style={menuStyles.welcome}>{user ? 'WELCOME BACK' : 'WELCOME'}</Text>
              <Text numberOfLines={1} style={menuStyles.customerName}>{user?.fullName || user?.email || 'Cougar Electric Customer'}</Text>
            </View>
            <Pressable accessibilityLabel="Close menu" accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <Text style={menuStyles.close}>×</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => { onClose(); onRequestService(); }}
            style={({ pressed }) => [menuStyles.requestButton, pressed && styles.buttonPressed]}
          >
            <Text style={menuStyles.requestIcon}>ϟ</Text>
            <Text style={menuStyles.requestText}>REQUEST SERVICE</Text>
          </Pressable>

          <View style={menuStyles.items}>
            {ITEMS.map((item) => (
              <Pressable key={item.label} accessibilityRole="button" onPress={() => navigate(item.path)} style={({ pressed }) => [menuStyles.item, pressed && menuStyles.itemPressed]}>
                <Text style={menuStyles.itemIcon}>{item.icon}</Text>
                <Text style={menuStyles.itemLabel}>{item.label}</Text>
                <Text style={menuStyles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>

          {!user && (
            <Pressable accessibilityRole="button" onPress={() => navigate('/account')} style={menuStyles.signInButton}>
              <Text style={menuStyles.signInText}>SIGN IN OR CREATE AN ACCOUNT</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function initials(value?: string) {
  if (!value) return 'CE';
  return value.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CE';
}

const menuStyles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.72)', flex: 1 },
  drawer: { backgroundColor: '#0B1424', borderRightColor: '#2C3950', borderRightWidth: 1, flex: 1, maxWidth: 380, padding: 24, paddingTop: 54, width: '88%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  avatar: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  avatarText: { color: '#07101F', fontSize: 14, fontWeight: '900' },
  headerCopy: { flex: 1 },
  welcome: { color: '#F5B900', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  customerName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 4 },
  close: { color: '#DCE4EF', fontSize: 31, lineHeight: 34 },
  requestButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', marginTop: 28, minHeight: 56 },
  requestIcon: { color: '#07101F', fontSize: 22, marginRight: 10 },
  requestText: { color: '#07101F', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  items: { borderColor: '#2C3950', borderRadius: 16, borderWidth: 1, marginTop: 20, overflow: 'hidden' },
  item: { alignItems: 'center', borderBottomColor: '#263247', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingHorizontal: 15 },
  itemPressed: { backgroundColor: '#152139' },
  itemIcon: { color: '#F5B900', fontSize: 21, textAlign: 'center', width: 30 },
  itemLabel: { color: '#F5F7FB', flex: 1, fontSize: 14, fontWeight: '700', marginLeft: 10 },
  chevron: { color: '#8593A9', fontSize: 25 },
  signInButton: { alignItems: 'center', borderColor: '#F5B900', borderRadius: 12, borderWidth: 1, marginTop: 22, padding: 14 },
  signInText: { color: '#F5B900', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
});
