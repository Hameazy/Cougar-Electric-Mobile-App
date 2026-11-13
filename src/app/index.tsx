import { Redirect } from 'expo-router';

// The customer dashboard is public; authentication is optional until needed.
export default function Index() {
  return <Redirect href="/dashboard" />;
}
