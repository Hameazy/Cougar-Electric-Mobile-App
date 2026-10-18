// CEI-7: turns a failed sign-in into a message the customer can actually understand.
// Firebase Auth errors come with a code like 'auth/invalid-credential'.

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_SECONDS = 30;

export function signInErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';

  switch (code) {
    // wrong email or password -- we don't say which one on purpose,
    // so nobody can use this screen to check if an email has an account
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. Please try again.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please call Cougar Electric for help.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    default:
      return 'We could not sign you in. Please try again.';
  }
}

// After too many misses in a row, pause sign-in for a bit.
// Firebase also limits attempts on its side; this just gives a clearer message in the app.
export function lockSecondsAfter(failedAttempts: number): number {
  return failedAttempts >= MAX_FAILED_ATTEMPTS ? LOCK_SECONDS : 0;
}
