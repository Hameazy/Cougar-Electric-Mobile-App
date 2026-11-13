import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BottomNavigationProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const TAB_DETAILS: Record<string, { icon: string; label: string }> = {
  dashboard: { icon: '⌂', label: 'Home' },
  'my-jobs': { icon: '▤', label: 'My Jobs' },
  messages: { icon: '◯', label: 'Messages' },
  payments: { icon: '▭', label: 'Payments' },
  account: { icon: '♙', label: 'Account' },
};

export function BottomNavigation({
  state,
  navigateToTab,
  insets,
}: BottomNavigationProps) {
  const activeKey = state.routes[state.index]?.key;

  return (
    <View
      style={[
        navStyles.bar,
        { paddingBottom: Math.max(12, insets.bottom) },
      ]}
    >
      {state.routes.map((route) => {
        const tab = TAB_DETAILS[route.name];
        if (!tab) return null;

        const selected = activeKey === route.key;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) navigateToTab(route.key);
            }}
            style={navStyles.item}
          >
            <Text style={[navStyles.icon, selected && navStyles.active]}>
              {tab.icon}
            </Text>
            <Text style={[navStyles.label, selected && navStyles.active]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  bar: { backgroundColor: '#070D18', borderTopColor: '#293244', borderTopWidth: 1, flexDirection: 'row', paddingTop: 10 },
  item: { alignItems: 'center', flex: 1 },
  icon: { color: '#61708A', fontSize: 23 },
  label: { color: '#61708A', fontSize: 10, marginTop: 4 },
  active: { color: '#F5B900', fontWeight: '700' },
});
