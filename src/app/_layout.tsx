// Sets up how pages open and the phone status bar. Expo Router needs this filename.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createElement } from 'react';
import { ServiceRequestDraftProvider } from '../serviceRequests/ServiceRequestDraftProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return createElement(
    SafeAreaProvider,
    null,
    createElement(StatusBar, { style: 'light' }),
    createElement(
      ServiceRequestDraftProvider,
      null,
      createElement(Stack, {
        screenOptions: ({ route }) => ({
          animation: 'slide_from_right',
          animationTypeForReplace:
            getTransitionDirection(route.params) === 'left' ? 'pop' : 'push',
          contentStyle: { backgroundColor: '#070B13' },
          fullScreenGestureEnabled: false,
          gestureEnabled: false,
          headerShown: false,
        }),
      }),
    ),
  );
}

function getTransitionDirection(params: unknown): 'left' | 'right' | undefined {
  if (
    !params
    || typeof params !== 'object'
    || !('transitionDirection' in params)
  ) {
    return undefined;
  }

  const direction = params.transitionDirection;
  return direction === 'left' || direction === 'right' ? direction : undefined;
}
