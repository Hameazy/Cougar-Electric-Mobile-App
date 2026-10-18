// CEI-7: red message box shown above the sign-in form when something goes wrong.
// Uses the same notice style as the Create Account page.
import { Text, View } from 'react-native';
import { styles } from '../styles/PageStyle';

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.notice}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.noticeText}>{message}</Text>
    </View>
  );
}
