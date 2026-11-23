import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { styles } from '../styles/PageStyle';
import { ErrorBanner } from './ErrorBanner';

export function CancelServiceRequestDialog({
  visible,
  loading,
  errorMessage,
  onKeepRequest,
  onConfirm,
}: {
  visible: boolean;
  loading: boolean;
  errorMessage: string;
  onKeepRequest: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => {
        if (!loading) onKeepRequest();
      }}
    >
      <View style={dialogStyles.backdrop}>
        <View accessibilityViewIsModal style={dialogStyles.dialog}>
          <Text accessibilityRole="header" style={dialogStyles.title}>Cancel this request?</Text>
          <Text style={dialogStyles.body}>
            Your electrician will no longer be dispatched for this service request.
          </Text>

          <ErrorBanner message={errorMessage} />

          <View style={dialogStyles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onKeepRequest}
              style={({ pressed }) => [
                dialogStyles.keepButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={dialogStyles.keepText}>KEEP REQUEST</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: loading, disabled: loading }}
              disabled={loading}
              onPress={onConfirm}
              style={({ pressed }) => [
                dialogStyles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={dialogStyles.confirmText}>YES, CANCEL</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const dialogStyles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(2, 5, 10, 0.78)', flex: 1, justifyContent: 'center', padding: 22 },
  dialog: { backgroundColor: '#111722', borderColor: '#3A4250', borderRadius: 20, borderWidth: 1, maxWidth: 440, padding: 22, width: '100%' },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  body: { color: '#AAB5C7', fontSize: 14, lineHeight: 22, marginTop: 9 },
  actions: { gap: 10, marginTop: 20 },
  keepButton: { alignItems: 'center', borderColor: '#596579', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  keepText: { color: '#F8FAFC', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  confirmButton: { alignItems: 'center', backgroundColor: '#9F3542', borderRadius: 12, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  confirmText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
});
