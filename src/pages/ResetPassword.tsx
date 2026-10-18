
import { Link } from 'expo-router';
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
import { Logo } from '../parts/Logo';
import { TextBox } from '../parts/TextBox';
import { styles } from '../styles/PageStyle';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [validated, setValidated] = useState(false);

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

  function submit() {
    Keyboard.dismiss();
    setAttempted(true);

    if (passwordError || confirmError) return;

    // TODO: Verify the reset token and update the password
    // through the team's authentication provider.
    // This screen currently validates inputs only.
    setPassword('');
    setConfirmPassword('');
    setValidated(true);
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
            <Text style={styles.toplineText}>CUSTOMER ACCESS</Text>
            <Text style={styles.step}>COUGAR ELECTRIC</Text>
          </View>

          <Logo />

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              RELIABLE. PROFESSIONAL. LOCAL.
            </Text>

            <Text accessibilityRole="header" style={styles.title}>
              Create a new password.
            </Text>

            <Text style={styles.subtitle}>
              Choose a new password to secure your Cougar Electric account.
            </Text>
          </View>

          <View style={styles.card}>
            {validated ? (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Password validated
                </Text>

                <Text style={styles.cardSubtitle}>
                  Your new password meets the requirements.
                  Your account password has not been changed yet
                  because authentication is not connected.
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

                <Pressable
                  accessibilityRole="button"
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    VALIDATE PASSWORD →
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
