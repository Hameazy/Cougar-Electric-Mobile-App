// The "List" half of the Map / List toggle: the same electricians as the map,
// as one scrolling page of cards (Rover-style). The map stays mounted underneath,
// so switching back is instant and the selected electrician is still selected.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MAP_COLORS } from './ServiceMapTypes';

export function ListPage({ topInset, bottomInset, children }: { topInset: number; bottomInset: number; children: ReactNode }) {
  return (
    <View style={listStyles.page}>
      <ScrollView
        contentContainerStyle={[listStyles.content, { paddingBottom: bottomInset + 32, paddingTop: topInset }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={listStyles.column}>{children}</View>
      </ScrollView>
    </View>
  );
}

const listStyles = StyleSheet.create({
  page: { ...StyleSheet.absoluteFill, backgroundColor: MAP_COLORS.land, zIndex: 3 },
  content: { alignItems: 'center', paddingHorizontal: 18 },
  column: { gap: 14, maxWidth: 720, width: '100%' },
});
