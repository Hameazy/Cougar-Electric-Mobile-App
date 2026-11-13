import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  authService,
  getAuthErrorMessage,
} from '../auth/FirebaseAuthenticationService';
import { useAuthSession } from '../helpers/useAuthSession';
import { ErrorBanner } from '../parts/ErrorBanner';
import { styles } from '../styles/PageStyle';
import SignIn from './SignIn';

export default function Account() {
  const { user, loading } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function signOut() {
    if (signingOut) return;

    setSigningOut(true);
    setErrorMessage('');
    try {
      await authService.signOut();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safe, accountStyles.loading]}
      >
        <ActivityIndicator color="#F5B900" />
      </SafeAreaView>
    );
  }

  if (!user) return <SignIn accountTab />;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={accountStyles.content}>
        <Text style={accountStyles.eyebrow}>ACCOUNT</Text>
        <Text accessibilityRole="header" style={accountStyles.title}>
          Your account
        </Text>

        <View style={accountStyles.card}>
          <Text style={accountStyles.status}>SIGNED IN</Text>
          <Text style={accountStyles.email}>
            {user.email || 'Customer account'}
          </Text>

          <ErrorBanner message={errorMessage} />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: signingOut, disabled: signingOut }}
            disabled={signingOut}
            onPress={() => void signOut()}
            style={({ pressed }) => [
              accountStyles.signOutButton,
              pressed && styles.buttonPressed,
              signingOut && accountStyles.disabled,
            ]}
          >
            {signingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={accountStyles.signOutText}>SIGN OUT</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const accountStyles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignSelf: 'center',
    maxWidth: 600,
    padding: 22,
    paddingBottom: 40,
    width: '100%',
  },
  eyebrow: {
    color: '#F5B900',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 9,
  },
  card: {
    backgroundColor: '#111722',
    borderColor: '#353F50',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 26,
    padding: 22,
  },
  status: {
    color: '#55D68B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  email: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#9F3542',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 50,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
});
