import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & { label: string; error?: string; hint?: string; password?: boolean };

export function TextBox({ label, error, hint, password, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.focused, !!error && styles.invalid]}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          accessibilityHint={error || hint}
          placeholderTextColor="#7F8BA0"
          secureTextEntry={password && !visible}
          onFocus={() => setFocused(true)}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
          style={styles.input}
        />
        {password && <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onPress={() => setVisible(!visible)} style={styles.toggle}><Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text></Pressable>}
      </View>
      {!!(error || hint) && <Text accessibilityLiveRegion="polite" style={[styles.hint, !!error && styles.error]}>{error || hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7, marginBottom: 18 },
  label: { color: '#E0E5EF', fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#3A4250', borderRadius: 12, backgroundColor: '#0A101B', alignItems: 'center' },
  focused: { borderColor: '#F5B900' },
  invalid: { borderColor: '#FF9A91' },
  input: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#F8FAFC' },
  toggle: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center' },
  toggleText: { color: '#F5B900', fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, color: '#99A7BC', lineHeight: 18 },
  error: { color: '#FF9A91' },
});
