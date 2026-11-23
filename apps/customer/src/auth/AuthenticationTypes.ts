export type RegistrationFormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  password: string;
  confirmPassword: string;
};

export type RegistrationRequest = Omit<RegistrationFormValues, 'confirmPassword'>;

export type SignInCredentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
};

// Authentication credentials remain private to the eventual service adapter.
// UI code receives only the authenticated user's safe profile information.
export type AuthSession = {
  user: AuthUser;
};

export type RegistrationResult = {
  user: AuthUser;
  requiresVerification: boolean;
};
