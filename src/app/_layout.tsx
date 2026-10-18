// Sets up how pages open and the phone status bar. Expo Router needs this filename.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return createElement(
    SafeAreaProvider,
    null,
    createElement(StatusBar, { style: 'light' }),
    createElement(Stack, {
      screenOptions: { headerShown: false, contentStyle: { backgroundColor: '#070B13' } },
    }),
  );
}
