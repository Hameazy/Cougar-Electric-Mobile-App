import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { AuthUser } from '../auth/AuthenticationTypes';
import { useAuthSession } from '../helpers/useAuthSession';

export function SignedInOnly({ returnTo, children }: { returnTo: 'my-jobs' | 'messages'; children: (user: AuthUser) => ReactNode }) {
  const { user, loading } = useAuthSession();

  if (loading) return <View style={lockedStyles.loading}><ActivityIndicator color="#F5B900" /></View>;
  if (user) return <>{children(user)}</>;

  return (
    <View style={lockedStyles.card}>
      <View style={lockedStyles.lock}><Text style={lockedStyles.lockIcon}>⌑</Text></View>
      <Text accessibilityRole="header" style={lockedStyles.title}>Sign in to continue</Text>
      <Text style={lockedStyles.body}>Your service activity and conversations are private. Sign in to see information connected to your account.</Text>
      <Link href={{ pathname: '/sign-in', params: { returnTo } }} style={lockedStyles.button}>SIGN IN</Link>
      <Link href="/register" style={lockedStyles.link}>Create an account</Link>
    </View>
  );
}

const lockedStyles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  card: { alignItems: 'center', backgroundColor: '#111722', borderColor: '#353F50', borderRadius: 20, borderWidth: 1, marginTop: 26, padding: 28 },
  lock: { alignItems: 'center', backgroundColor: '#17233A', borderRadius: 28, height: 56, justifyContent: 'center', marginBottom: 18, width: 56 },
  lockIcon: { color: '#F5B900', fontSize: 27 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '800' },
  body: { color: '#AAB5C7', fontSize: 14, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  button: { backgroundColor: '#F5B900', borderRadius: 12, color: '#080C14', fontSize: 13, fontWeight: '800', marginTop: 24, overflow: 'hidden', paddingHorizontal: 52, paddingVertical: 15 },
  link: { color: '#8ABEFF', fontSize: 13, fontWeight: '700', marginTop: 18 },
});
