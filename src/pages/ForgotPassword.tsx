
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = !email.trim()
    ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : undefined;

  function submit() {
    Keyboard.dismiss();
    setAttempted(true);

    if (emailError) return;

    // TODO: Connect to the authentication service when available.
    // No reset email is sent by this frontend-only version.
    setSubmitted(true);
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
              Reset your password.
            </Text>

            <Text style={styles.subtitle}>
              Forgot your password? We’ll help you get back to
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
                  Request received
                </Text>

                <Text style={styles.cardSubtitle}>
                  Your email address has been validated.
                  Password reset emails are not available
                  until account authentication is connected.
                </Text>

                <Link href="/" style={styles.textLink}>
                  Back to sign in
                </Link>
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

                <Pressable
                  accessibilityRole="button"
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    CONTINUE →
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
