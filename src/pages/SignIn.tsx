import { Link } from 'expo-router';
import { useRef, useState } from 'react';
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
import { authService, getAuthErrorMessage } from '../auth/service';
import { useSignInAttempts } from '../helpers/useSignInAttempts';
import { ErrorBanner } from '../parts/ErrorBanner';
import { Logo } from '../parts/Logo';
import { TextBox } from '../parts/TextBox';
import { styles } from '../styles/PageStyle';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [continued, setContinued] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordInputKey, setPasswordInputKey] = useState(0);
  const submittingRef = useRef(false);
  const {
    message,
    locked,
    recordFailure,
    recordSuccess,
    clearMessage,
  } = useSignInAttempts(getAuthErrorMessage);

  const emailError = !email.trim()
    ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : undefined;

  const passwordError = !password
    ? 'Enter your password.'
    : undefined;

  async function submit() {
    if (submittingRef.current || locked) return;

    Keyboard.dismiss();
    setAttempted(true);
    clearMessage();

    if (emailError || passwordError) return;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      await authService.signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      recordSuccess();
      setContinued(true);
    } catch (error) {
      recordFailure(error);
    } finally {
      setPassword('');
      setPasswordInputKey((key) => key + 1);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const signInDisabled = submitting || locked;

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
              {continued
                ? 'Welcome back.'
                : 'Electrical help.\nWhen you need it.'}
            </Text>

            <Text style={styles.subtitle}>
              {continued
                ? 'Your next service starts here.'
                : 'Sign in to manage your electrical service and stay connected with our team.'}
            </Text>

            <View style={styles.pill}>
              <View style={styles.dot} />
              <Text style={styles.pillText}>
                Residential  •  Commercial  •  Industrial
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            {continued ? (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Welcome to Cougar Electric
                </Text>

                <Text style={styles.subtitle}>
                  Reliable electrical service, whenever you need it.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  style={styles.button}
                  onPress={() => {
                    setContinued(false);
                    setAttempted(false);
                  }}
                >
                  <Text style={styles.buttonText}>
                    BACK TO SIGN IN  →
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Sign in
                </Text>

                <Text style={styles.cardSubtitle}>
                  Welcome back. Enter your details to continue.
                </Text>

                <ErrorBanner message={message} />

                <View style={{ marginTop: 26 }}>
                  <TextBox
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearMessage();
                    }}
                    error={attempted ? emailError : undefined}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TextBox
                    key={passwordInputKey}
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearMessage();
                    }}
                    error={attempted ? passwordError : undefined}
                    password
                    autoComplete="current-password"
                    textContentType="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={submit}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: signInDisabled,
                    busy: submitting,
                  }}
                  disabled={signInDisabled}
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {submitting
                      ? 'SIGNING IN…'
                      : locked
                        ? 'PLEASE WAIT…'
                        : 'SIGN IN   →'}
                  </Text>
                </Pressable>

                <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
                  <Link
                    href="/forgot-password"
                    style={styles.textLink}
                  >
                    Forgot password?
                  </Link>
                </View>

                <View style={styles.accountLink}>
                  <Text style={styles.cardSubtitle}>
                    Don’t have an account?
                  </Text>
                  <Link href="/register" style={styles.textLink}>
                    Create here
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
