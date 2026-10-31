
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorBanner } from '../parts/ErrorBanner';
import {
  createServiceRequestId,
  submitServiceRequest,
} from './submission';
import {
  validateServiceRequest,
  type ServiceRequestInput,
} from './validation';

type SubmitServiceRequestProps = {
  request: ServiceRequestInput;
  onSuccess?: (requestId: string) => void;
};

export function SubmitServiceRequest({
  request,
  onSuccess,
}: SubmitServiceRequestProps) {
  const requestId = useRef<string | null>(null);
  const submitting = useRef(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  async function handleSubmit() {
    // Prevent repeated taps and accidental duplicate submissions.
    if (submitting.current || submittedId) return;

    setErrorMessage('');

    const errors = validateServiceRequest(request);

    if (Object.keys(errors).length > 0) {
      setErrorMessage(
        'Please complete all required information before submitting.',
      );
      return;
    }

    // Generate the ID once and keep it for retries.
    if (!requestId.current) {
      requestId.current = createServiceRequestId();
    }

    submitting.current = true;
    setLoading(true);

    try {
      const savedId = await submitServiceRequest(
        request,
        requestId.current,
      );

      setSubmittedId(savedId);
      onSuccess?.(savedId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ErrorBanner message={errorMessage} />

      {submittedId ? (
        <View style={styles.successBox}>
          <Text
            style={styles.successTitle}
            accessibilityRole="header"
          >
            Request submitted successfully!
          </Text>

          <Text style={styles.successText}>
            Your service request has been received.
          </Text>

          <Text selectable style={styles.requestId}>
            Request ID: {submittedId}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Submit service request"
          accessibilityState={{ disabled: loading, busy: loading }}
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Submit Service Request
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  successTitle: {
    color: '#166534',
    fontSize: 18,
    fontWeight: '700',
  },
  successText: {
    color: '#166534',
    fontSize: 14,
  },
  requestId: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '500',
  },
});
