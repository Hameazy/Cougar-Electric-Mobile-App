import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Tab = 'Home' | 'My Jobs' | 'Messages' | 'Payments' | 'Account';

const TABS: { icon: string; label: Tab }[] = [
  { icon: '⌂', label: 'Home' },
  { icon: '▤', label: 'My Jobs' },
  { icon: '◯', label: 'Messages' },
  { icon: '▭', label: 'Payments' },
  { icon: '♙', label: 'Account' },
];

export function BottomNavigation({ active, onUnavailable }: { active: Tab; onUnavailable?: (label: string) => void }) {
  function navigate(label: Tab) {
    if (label === 'Home') router.replace('/dashboard');
    else if (label === 'My Jobs') router.push('/my-jobs');
    else if (label === 'Messages') router.push('/messages');
    else if (label === 'Account') router.push('/sign-in');
    else onUnavailable?.(label);
  }

  return (
    <View style={navStyles.bar}>
      {TABS.map(({ icon, label }) => (
        <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: active === label }} onPress={() => navigate(label)} style={navStyles.item}>
          <Text style={[navStyles.icon, active === label && navStyles.active]}>{icon}</Text>
          <Text style={[navStyles.label, active === label && navStyles.active]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const navStyles = StyleSheet.create({
  bar: { backgroundColor: '#070D18', borderTopColor: '#293244', borderTopWidth: 1, bottom: 0, flexDirection: 'row', left: 0, paddingBottom: 12, paddingTop: 10, position: 'absolute', right: 0 },
  item: { alignItems: 'center', flex: 1 },
  icon: { color: '#61708A', fontSize: 23 },
  label: { color: '#61708A', fontSize: 10, marginTop: 4 },
  active: { color: '#F5B900', fontWeight: '700' },
});
