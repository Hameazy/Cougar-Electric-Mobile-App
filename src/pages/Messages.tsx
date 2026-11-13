import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthUser } from '../auth/AuthenticationTypes';
import { sendTechnicianMessage } from '../messages/sendMessageToAvailableTechnician';
import { AppSectionHeader } from '../parts/AppSectionHeader';
import { SignedInOnly } from '../parts/SignedInOnly';
import { styles } from '../styles/PageStyle';

export default function Messages() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={messageStyles.content} keyboardShouldPersistTaps="handled">
        <AppSectionHeader eyebrow="CUSTOMER SUPPORT" title="Messages" subtitle="Send a question to any available Cougar Electric technician." />
        <SignedInOnly returnTo="messages">{(user) => <MessageComposer user={user} />}</SignedInOnly>
      </ScrollView>
    </SafeAreaView>
  );
}

function MessageComposer({ user }: { user: AuthUser }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function send() {
    if (sending || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendTechnicianMessage(user.id, message);
      setMessage('');
      setSent(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={messageStyles.card}>
        <Text style={messageStyles.sentIcon}>✓</Text>
        <Text accessibilityRole="header" style={messageStyles.title}>Message sent</Text>
        <Text style={messageStyles.body}>An available technician will respond within 3–5 business days.</Text>
        <Pressable accessibilityRole="button" onPress={() => setSent(false)} style={messageStyles.outlineButton}><Text style={messageStyles.outlineText}>SEND ANOTHER MESSAGE</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={messageStyles.card}>
      <View style={messageStyles.recipient}>
        <View style={messageStyles.avatar}><Text style={messageStyles.avatarText}>CE</Text></View>
        <View style={messageStyles.recipientCopy}><Text style={messageStyles.label}>TO</Text><Text style={messageStyles.recipientName}>Any available technician</Text></View>
        <View style={messageStyles.onlineDot} />
      </View>
      <Text style={messageStyles.responseNote}>Typical response time: 3–5 business days</Text>
      <Text style={messageStyles.fieldLabel}>HOW CAN WE HELP?</Text>
      <View style={[messageStyles.inputWrap, !!error && messageStyles.inputError]}>
        <TextInput
          accessibilityLabel="Message to a technician"
          multiline
          maxLength={1000}
          onChangeText={(value) => { setMessage(value); setError(''); }}
          placeholder="Write your message here…"
          placeholderTextColor="#6F7B90"
          style={messageStyles.input}
          textAlignVertical="top"
          value={message}
        />
        <Text style={messageStyles.count}>{message.length}/1000</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={messageStyles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !message.trim() || sending, busy: sending }} disabled={!message.trim() || sending} onPress={() => void send()} style={({ pressed }) => [messageStyles.sendButton, (!message.trim() || sending) && messageStyles.disabled, pressed && styles.buttonPressed]}>
        <Text style={messageStyles.sendText}>{sending ? 'SENDING…' : 'SEND MESSAGE'}</Text>
      </Pressable>
    </View>
  );
}

const messageStyles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 600, padding: 22, paddingBottom: 40, width: '100%' },
  card: { alignItems: 'stretch', backgroundColor: '#111722', borderColor: '#353F50', borderRadius: 20, borderWidth: 1, marginTop: 26, padding: 22 },
  recipient: { alignItems: 'center', flexDirection: 'row' },
  avatar: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: '#080C14', fontSize: 12, fontWeight: '900' },
  recipientCopy: { flex: 1, marginLeft: 12 },
  label: { color: '#7F8BA0', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  recipientName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 3 },
  onlineDot: { backgroundColor: '#4CC38A', borderRadius: 5, height: 10, width: 10 },
  responseNote: { backgroundColor: '#17233A', borderRadius: 10, color: '#AFC4E2', fontSize: 12, marginTop: 18, overflow: 'hidden', padding: 12, textAlign: 'center' },
  fieldLabel: { color: '#8290A6', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8, marginTop: 22 },
  inputWrap: { backgroundColor: '#0A101B', borderColor: '#3A4250', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  inputError: { borderColor: '#FF8E86' },
  input: { color: '#F8FAFC', fontSize: 15, lineHeight: 22, minHeight: 150, padding: 14 },
  count: { color: '#748198', fontSize: 10, paddingBottom: 10, paddingRight: 12, textAlign: 'right' },
  error: { color: '#FF9A91', fontSize: 12, marginTop: 8 },
  sendButton: { alignItems: 'center', backgroundColor: '#F5B900', borderRadius: 13, justifyContent: 'center', marginTop: 18, minHeight: 54 },
  disabled: { opacity: 0.4 },
  sendText: { color: '#080C14', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  sentIcon: { color: '#F5B900', fontSize: 42, fontWeight: '900', textAlign: 'center' },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  body: { color: '#AAB5C7', fontSize: 14, lineHeight: 22, marginTop: 9, textAlign: 'center' },
  outlineButton: { alignItems: 'center', borderColor: '#F5B900', borderRadius: 12, borderWidth: 1, marginTop: 22, paddingVertical: 14 },
  outlineText: { color: '#F5B900', fontSize: 12, fontWeight: '800' },
});
