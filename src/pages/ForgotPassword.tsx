

import { Link } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth } from '../../firebaseConfig';
import { Logo } from '../parts/Logo';
import { TextBox } from '../parts/TextBox';
import { styles } from '../styles/PageStyle';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  const emailError = !email.trim()
    ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : undefined;

  async function submit() {
    Keyboard.dismiss();
    setAttempted(true);
    setRequestError('');

    if (emailError || loading) return;

    setLoading(true);

    try {
      // Ask Firebase to send a password reset email.
      await sendPasswordResetEmail(auth, email.trim());

      setSubmitted(true);
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';

      if (code === 'auth/too-many-requests') {
        setRequestError(
          'Too many attempts. Please try again later.'
        );
      } else if (
        code === 'auth/invalid-api-key' ||
        code === 'auth/operation-not-allowed'
      ) {
        setRequestError(
          'Password reset is currently unavailable.'
        );
      } else {
        setRequestError(
          'Unable to process your request. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            pointerEvents="none"
            accessible={false}
            style={styles.backdrop}
          >
            <View style={styles.rail} />
            <View style={styles.windows}>
              <View style={styles.window} />
              <View style={styles.window} />
              <View style={styles.window} />
            </View>
            <View style={styles.rail} />
          </View>

          <View style={styles.topline}>
            <Text style={styles.toplineText}>
              CUSTOMER ACCESS
            </Text>
            <Text style={styles.step}>
              COUGAR ELECTRIC
            </Text>
          </View>

          <Logo />

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              RELIABLE. PROFESSIONAL. LOCAL.
            </Text>

            <Text
              accessibilityRole="header"
              style={styles.title}
            >
              Reset your password.
            </Text>

            <Text style={styles.subtitle}>
              Forgot your password? We'll help you get back to
              managing your electrical services.
            </Text>
          </View>

          <View style={styles.card}>
            {submitted ? (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Check your email
                </Text>

                <Text style={styles.cardSubtitle}>
                  If an account exists for this email address,
                  you should receive a password reset link
                  shortly. Please check your inbox and spam folder.
                </Text>

                <View style={{ marginTop: 24 }}>
                  <Link href="/" style={styles.textLink}>
                    Back to sign in
                  </Link>
                </View>
              </>
            ) : (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Forgot password?
                </Text>

                <Text style={styles.cardSubtitle}>
                  Enter your email address below to request
                  a password reset.
                </Text>

                <View style={{ marginTop: 26 }}>
                  <TextBox
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    error={attempted ? emailError : undefined}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                </View>

                {requestError ? (
                  <Text
                    accessibilityRole="alert"
                    style={{
                      color: '#B91C1C',
                      marginBottom: 12,
                    }}
                  >
                    {requestError}
                  </Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loading && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {loading
                      ? 'SENDING...'
                      : 'SEND RESET EMAIL →'}
                  </Text>
                </Pressable>

                <View style={styles.accountLink}>
                  <Text style={styles.cardSubtitle}>
                    Remember your password?
                  </Text>

                  <Link href="/" style={styles.textLink}>
                    Sign in
                  </Link>
                </View>
              </>
            )}
          </View>

          <Text style={styles.footer}>
            COUGAR ELECTRIC INC.  ·  CUSTOMER ACCESS
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
