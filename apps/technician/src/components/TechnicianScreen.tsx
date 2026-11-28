import { router } from 'expo-router';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

// Shared layout for Messages, Earnings and Settings.
export default function TechnicianScreen({
  title,
  subtitle,
  children,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={() => router.replace('/')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Back to Home</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.brand}>TECHNICIAN WORKSPACE</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07101F',
  },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    padding: 28,
    gap: 18,
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  backText: {
    color: '#F5B900',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    gap: 8,
    paddingBottom: 8,
  },
  brand: {
    color: '#F5B900',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94A2B8',
    fontSize: 14,
    lineHeight: 21,
  },
});