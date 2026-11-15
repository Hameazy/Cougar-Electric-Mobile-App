// The floating search bar at the top of the map (like Google Maps): back button,
// address box, and a list of matches when the search finds more than one place.
// The screen does the actual searching, this part only draws the box and list.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { PlaceMatch } from '../../technicians/placeParsing';
import { MAP_COLORS } from './ServiceMapTypes';

export function MapSearchBar({
  leading,
  value,
  onChangeText,
  onSubmit,
  onClear,
  busy,
  message,
  matches,
  onPickMatch,
  caption,
  onResetToRequest,
  messageInset = 0,
}: {
  // the back button
  leading: ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  busy: boolean;
  // "No match for that address", shown under the box
  message: string;
  matches: PlaceMatch[];
  onPickMatch: (match: PlaceMatch) => void;
  // small line under the box, e.g. "Showing electricians near your service address"
  caption?: string;
  // when the customer searched somewhere else, a way back to their service address
  onResetToRequest?: () => void;
  // keeps messages from covering the round buttons that sit under the bar on phones
  messageInset?: number;
}) {
  return (
    <View style={searchStyles.wrap} pointerEvents="box-none">
      <View style={searchStyles.row}>
        <View style={searchStyles.back}>{leading}</View>
        <View style={searchStyles.pill}>
          <View style={searchStyles.glass}>
            <View style={searchStyles.glassLens} />
            <View style={searchStyles.glassHandle} />
          </View>
          <TextInput
            accessibilityLabel="Search for an address, city or ZIP code"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder="Search address or ZIP code"
            placeholderTextColor={MAP_COLORS.muted}
            returnKeyType="search"
            selectTextOnFocus
            style={searchStyles.input}
            value={value}
          />
          {busy ? (
            <ActivityIndicator color={MAP_COLORS.volt} />
          ) : value.length > 0 ? (
            <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={10} onPress={onClear}>
              <Text style={searchStyles.clear}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {matches.length > 0 && (
        <View accessibilityRole="list" style={searchStyles.results}>
          {matches.map((match, index) => (
            <Pressable
              key={`${match.latitude},${match.longitude},${index}`}
              accessibilityRole="button"
              onPress={() => onPickMatch(match)}
              style={({ pressed }) => [searchStyles.result, index > 0 && searchStyles.resultDivider, pressed && searchStyles.pressed]}
            >
              <Text style={searchStyles.resultLabel} numberOfLines={1}>{match.label}</Text>
              <Text style={searchStyles.resultDetail} numberOfLines={1}>{match.detail}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!!message && (
        <View style={[searchStyles.messageBox, { marginRight: messageInset }]}>
          <Text accessibilityRole="alert" style={searchStyles.messageText}>{message}</Text>
        </View>
      )}

      {!message && matches.length === 0 && !!caption && (
        <View style={searchStyles.caption}>
          <Text style={searchStyles.captionText} numberOfLines={1}>{caption}</Text>
          {onResetToRequest && (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onResetToRequest}>
              <Text style={searchStyles.captionLink}>Use my service address</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const FLOAT_BACKGROUND = 'rgba(17, 23, 34, 0.95)';

const searchStyles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  back: { alignItems: 'center', backgroundColor: FLOAT_BACKGROUND, borderColor: MAP_COLORS.line, borderRadius: 24, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  pill: { alignItems: 'center', backgroundColor: FLOAT_BACKGROUND, borderColor: MAP_COLORS.line, borderRadius: 24, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 10, height: 48, paddingHorizontal: 16 },
  input: { color: MAP_COLORS.text, flex: 1, fontSize: 16, height: 46, minWidth: 0, ...({ outlineStyle: 'none' } as object) },
  clear: { color: MAP_COLORS.muted, fontSize: 16, fontWeight: '700' },
  glass: { height: 18, width: 18 },
  glassLens: { borderColor: MAP_COLORS.muted, borderRadius: 7, borderWidth: 2, height: 14, left: 0, position: 'absolute', top: 0, width: 14 },
  glassHandle: { backgroundColor: MAP_COLORS.muted, borderRadius: 1, bottom: 1, height: 2, position: 'absolute', right: -1, transform: [{ rotate: '45deg' }], width: 7 },
  results: { backgroundColor: 'rgba(17, 23, 34, 0.98)', borderColor: MAP_COLORS.line, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  result: { gap: 2, minHeight: 56, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  resultDivider: { borderTopColor: '#2A3240', borderTopWidth: 1 },
  pressed: { backgroundColor: '#1B2638' },
  resultLabel: { color: MAP_COLORS.text, fontSize: 15, fontWeight: '700' },
  resultDetail: { color: MAP_COLORS.muted, fontSize: 13 },
  messageBox: { backgroundColor: '#301B20', borderColor: '#5A2C33', borderRadius: 12, borderWidth: 1, padding: 12 },
  messageText: { color: '#FFB1A8', fontSize: 14, lineHeight: 20 },
  caption: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: FLOAT_BACKGROUND, borderColor: MAP_COLORS.line, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 7 },
  captionText: { color: '#D7DFEC', flexShrink: 1, fontSize: 12 },
  captionLink: { color: MAP_COLORS.volt, fontSize: 12, fontWeight: '800' },
});
