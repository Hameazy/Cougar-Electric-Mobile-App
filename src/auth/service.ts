import { AuthServiceError, type AuthService } from './service-contract';

const messages = {
  NOT_CONFIGURED: 'Account services are currently unavailable. Please try again later.',
  EMAIL_IN_USE: 'An account with this email already exists. Please sign in or use a different email.',
  INVALID_CREDENTIALS: 'The email or password is incorrect. Please try again.',
  VALIDATION_ERROR: 'Some account information was not accepted. Please check your details and try again.',
  NETWORK_ERROR: 'Unable to connect to account services. Check your internet connection and try again.',
  UNKNOWN_ERROR: 'We could not complete your request. Please try again.',
} as const;

function notConfigured(): never {
  throw new AuthServiceError('NOT_CONFIGURED');
}

// This deliberately fails closed until the team supplies an AuthService adapter.
// It never creates a local account, returns a fake session, or stores credentials.
export const authService: AuthService = Object.freeze({
  register: async () => notConfigured(),
  signIn: async () => notConfigured(),
  restoreSession: async () => notConfigured(),
  signOut: async () => notConfigured(),
});

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) return messages[error.code];
  return messages.UNKNOWN_ERROR;
}
