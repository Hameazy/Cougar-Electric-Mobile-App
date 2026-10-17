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
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
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
