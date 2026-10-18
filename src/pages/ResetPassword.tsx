

import { Link, useLocalSearchParams } from 'expo-router';
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
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

export default function ResetPassword() {
  const params = useLocalSearchParams<{ oobCode?: string }>();

  const resetCode =
    typeof params.oobCode === 'string' ? params.oobCode : '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [validated, setValidated] = useState(false);

  const [checkingCode, setCheckingCode] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const passwordError = !password
    ? 'Enter a new password.'
    : password.length < 8
      ? 'Password must be at least 8 characters.'
      : undefined;

  const confirmError = !confirmPassword
    ? 'Confirm your new password.'
    : confirmPassword !== password
      ? 'Passwords do not match.'
      : undefined;

  // Check that the reset link contains a valid Firebase code.
  useEffect(() => {
    let active = true;

    async function checkCode() {
      setCheckingCode(true);
      setValidCode(false);
      setResetError('');
      setValidated(false);

      if (!resetCode) {
        setCheckingCode(false);
        return;
      }

      try {
        await verifyPasswordResetCode(auth, resetCode);

        if (active) {
          setValidCode(true);
        }
      } catch {
        if (active) {
          setValidCode(false);
        }
      } finally {
        if (active) {
          setCheckingCode(false);
        }
      }
    }

    checkCode();

    return () => {
      active = false;
    };
  }, [resetCode]);

  async function submit() {
    Keyboard.dismiss();
    setAttempted(true);
    setResetError('');

    if (
      passwordError ||
      confirmError ||
      !validCode ||
      !resetCode ||
      loading
    ) {
      return;
    }

    setLoading(true);

    try {
      // Firebase verifies the code and changes the password.
      await confirmPasswordReset(auth, resetCode, password);

      setPassword('');
      setConfirmPassword('');
      setValidated(true);
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';

      if (
        code === 'auth/expired-action-code' ||
        code === 'auth/invalid-action-code'
      ) {
        setValidCode(false);
        setResetError(
          'This reset link is invalid or expired. Request a new one.'
        );
      } else if (code === 'auth/weak-password') {
        setResetError(
          'Please choose a stronger password.'
        );
      } else {
        setResetError(
          'Unable to reset your password. Please try again.'
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
              Create a new password.
            </Text>

            <Text style={styles.subtitle}>
              Choose a new password to secure your
              Cougar Electric account.
            </Text>
          </View>

          <View style={styles.card}>
            {validated ? (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Password updated
                </Text>

                <Text style={styles.cardSubtitle}>
                  Your password has been reset successfully.
                  You can now sign in with your new password.
                </Text>

                <View style={{ marginTop: 24 }}>
                  <Link href="/" style={styles.textLink}>
                    Back to sign in
                  </Link>
                </View>
              </>
            ) : checkingCode ? (
              <>
                <Text style={styles.cardTitle}>
                  Checking reset link
                </Text>

                <Text style={styles.cardSubtitle}>
                  Please wait while we verify your
                  password reset link.
                </Text>
              </>
            ) : !validCode ? (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Invalid reset link
                </Text>

                <Text style={styles.cardSubtitle}>
                  This reset link is missing, invalid,
                  or expired. Please request a new one.
                </Text>

                <View style={{ marginTop: 24 }}>
                  <Link
                    href="/forgot-password"
                    style={styles.textLink}
                  >
                    Request another link
                  </Link>
                </View>
              </>
            ) : (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Reset password
                </Text>

                <Text style={styles.cardSubtitle}>
                  Enter and confirm your new password below.
                </Text>

                <View style={{ marginTop: 26 }}>
                  <TextBox
                    label="New password"
                    placeholder="Enter a new password"
                    value={password}
                    onChangeText={setPassword}
                    error={attempted ? passwordError : undefined}
                    password
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TextBox
                    label="Confirm new password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    error={attempted ? confirmError : undefined}
                    password
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                </View>

                {resetError ? (
                  <Text
                    accessibilityRole="alert"
                    style={{
                      color: '#B91C1C',
                      marginBottom: 12,
                    }}
                  >
                    {resetError}
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
                      ? 'RESETTING...'
                      : 'RESET PASSWORD →'}
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
