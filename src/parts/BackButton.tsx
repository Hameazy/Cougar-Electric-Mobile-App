import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  Text,
  type StyleProp,
  type TextStyle,
} from 'react-native';

type BackButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  fallback: Extract<Href, string>;
  textStyle: StyleProp<TextStyle>;
};

export function BackButton({
  accessibilityLabel,
  children,
  fallback,
  textStyle,
}: BackButtonProps) {
  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: fallback,
      params: { transitionDirection: 'left' },
    });
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={goBack}
    >
      <Text style={textStyle}>{children}</Text>
    </Pressable>
  );
}
