import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import {
  AuthServiceError,
  type AuthErrorCode,
  type AuthService,
} from './service-contract';
import { createCustomerProfile } from '../helpers/CustomerProfile';
import type { AuthSession, AuthUser } from './types';

const messages = {
  NOT_CONFIGURED: 'Account services are currently unavailable. Please try again later.',
  EMAIL_IN_USE: 'An account with this email already exists. Please sign in or use a different email.',
  INVALID_CREDENTIALS: 'The email or password is incorrect. Please try again.',
  TOO_MANY_REQUESTS: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  USER_DISABLED: 'This account has been disabled. Please call Cougar Electric for help.',
  VALIDATION_ERROR: 'Some account information was not accepted. Please check your details and try again.',
  NETWORK_ERROR: 'Unable to connect to account services. Check your internet connection and try again.',
  PROFILE_SAVE_FAILED: 'Your sign-in account was created, but we could not save your customer profile. Check your connection and tap Create Account again to retry.',
  SIGNED_IN_AS_DIFFERENT_USER: 'A different account is currently signed in. Sign out before creating another account.',
  UNKNOWN_ERROR: 'We could not complete your request. Please try again.',
} as const;

function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email ?? '',
    fullName: user.displayName ?? undefined,
  };
}

function toAuthSession(user: User): AuthSession {
  return { user: toAuthUser(user) };
}

function firebaseErrorCode(error: unknown): AuthErrorCode {
  if (!(error instanceof FirebaseError)) return 'UNKNOWN_ERROR';

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'EMAIL_IN_USE';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'INVALID_CREDENTIALS';
    case 'auth/too-many-requests':
      return 'TOO_MANY_REQUESTS';
    case 'auth/user-disabled':
      return 'USER_DISABLED';
    case 'auth/invalid-email':
    case 'auth/missing-password':
    case 'auth/weak-password':
      return 'VALIDATION_ERROR';
    case 'auth/network-request-failed':
    case 'auth/timeout':
      return 'NETWORK_ERROR';
    case 'auth/app-not-authorized':
    case 'auth/auth-domain-config-required':
    case 'auth/invalid-api-key':
    case 'auth/operation-not-allowed':
      return 'NOT_CONFIGURED';
    default:
      return 'UNKNOWN_ERROR';
  }
}

function normalizeFirebaseError(error: unknown): AuthServiceError {
  return new AuthServiceError(firebaseErrorCode(error));
}

async function getOrCreateRegistrationUser(email: string, password: string): Promise<User> {
  await auth.authStateReady();

  if (auth.currentUser) {
    const currentEmail = auth.currentUser.email?.trim().toLowerCase();
    if (currentEmail === email.trim().toLowerCase()) return auth.currentUser;

    throw new AuthServiceError('SIGNED_IN_AS_DIFFERENT_USER');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

const firebaseAuthService: AuthService = {
  async register(request) {
    let user: User;

    try {
      user = await getOrCreateRegistrationUser(request.email, request.password);
    } catch (error) {
      if (error instanceof AuthServiceError) throw error;
      throw normalizeFirebaseError(error);
    }

    try {
      await createCustomerProfile(user.uid, request);
    } catch {
      // Auth and Firestore cannot be committed atomically from the client.
      // Keep the authenticated user so the same form can retry only this step.
      throw new AuthServiceError('PROFILE_SAVE_FAILED');
    }

    return {
      user: toAuthUser(user),
      requiresVerification: !user.emailVerified,
    };
  },

  async signIn(credentials) {
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      return toAuthSession(result.user);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  async restoreSession() {
    try {
      await auth.authStateReady();
      return auth.currentUser ? toAuthSession(auth.currentUser) : null;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },
};

export const authService: AuthService = Object.freeze(firebaseAuthService);

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) return messages[error.code];
  return messages.UNKNOWN_ERROR;
}
