import type {
  AuthSession,
  RegistrationRequest,
  RegistrationResult,
  SignInCredentials,
} from './types';

export type AuthErrorCode =
  | 'NOT_CONFIGURED'
  | 'EMAIL_IN_USE'
  | 'INVALID_CREDENTIALS'
  | 'TOO_MANY_REQUESTS'
  | 'USER_DISABLED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'PROFILE_SAVE_FAILED'
  | 'SIGNED_IN_AS_DIFFERENT_USER'
  | 'UNKNOWN_ERROR';

export class AuthServiceError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthServiceError';
  }
}

export interface AuthService {
  register(request: RegistrationRequest): Promise<RegistrationResult>;
  signIn(credentials: SignInCredentials): Promise<AuthSession>;
  restoreSession(): Promise<AuthSession | null>;
  signOut(): Promise<void>;
}
