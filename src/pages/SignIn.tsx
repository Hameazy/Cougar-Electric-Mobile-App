import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { authService, getAuthErrorMessage } from '../auth/FirebaseAuthenticationService';
import { useSignInAttempts } from '../helpers/useSignInAttempts';
import { ErrorBanner } from '../parts/ErrorBanner';
import { Logo } from '../parts/Logo';
import { TextBox } from '../parts/TextBox';
import { styles } from '../styles/PageStyle';

export default function SignIn({ accountTab = false }: { accountTab?: boolean }) {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [continued, setContinued] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');
  const [passwordInputKey, setPasswordInputKey] = useState(0);
  const submittingRef = useRef(false);
  const {
    message,
    locked,
    recordFailure,
    recordSuccess,
    clearMessage,
  } = useSignInAttempts(getAuthErrorMessage);

  useEffect(() => {
    let mounted = true;

    authService.restoreSession()
      .then((session) => {
        if (mounted && session) {
          setContinued(true);
        }
      })
      .catch((error) => {
        if (mounted) setSessionMessage(getAuthErrorMessage(error));
      });

    return () => {
      mounted = false;
    };
  }, []);

  const emailError = !email.trim()
    ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : undefined;

  const passwordError = !password
    ? 'Enter your password.'
    : undefined;

  function goToDashboard() {
    if (accountTab) router.navigate('/dashboard');
    else router.dismissTo('/dashboard');
  }

  async function submit() {
    if (submittingRef.current || locked) return;

    Keyboard.dismiss();
    setAttempted(true);
    setSessionMessage('');
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
      if (accountTab) return;
      if (returnTo === 'my-jobs') router.dismissTo('/my-jobs');
      else if (returnTo === 'messages') router.dismissTo('/messages');
      else goToDashboard();
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
    <SafeAreaView
      edges={accountTab ? ['top', 'left', 'right'] : undefined}
      style={styles.safe}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {!accountTab && (
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
          )}

          {!accountTab && (
            <View style={styles.topline}>
              <Link href="/dashboard" replace style={styles.textLink}>
                ← Dashboard
              </Link>
              <Text style={styles.step}>COUGAR ELECTRIC</Text>
            </View>
          )}

          {!accountTab && <Logo />}

          {accountTab ? (
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>ACCOUNT</Text>
              <Text accessibilityRole="header" style={styles.title}>
                Sign in
              </Text>
              <Text style={styles.subtitle}>
                Sign in to manage your Cougar Electric account.
              </Text>
            </View>
          ) : (
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
            </View>
          )}

          <View style={styles.card}>
            {continued && !accountTab ? (
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

                <ErrorBanner message={sessionMessage} />

                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={goToDashboard}>
                  <Text style={styles.buttonText}>BACK TO DASHBOARD   →</Text>
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

                <ErrorBanner message={sessionMessage || message} />

                <View style={{ marginTop: 26 }}>
                  <TextBox
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setSessionMessage('');
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

          {!accountTab && (
            <Text style={styles.footer}>
              COUGAR ELECTRIC INC.  ·  CUSTOMER ACCESS
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
