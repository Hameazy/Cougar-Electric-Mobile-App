export type Registration = {
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

export type Errors = Partial<Record<keyof Registration, string>>;

export function validateRegistration(values: Registration): Errors {
  const errors: Errors = {};
  for (const key of Object.keys(values) as (keyof Registration)[]) {
    if (!values[key].trim()) errors[key] = 'This field is required.';
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.';
  if (values.phone && !/^\+?[\d\s().-]+$/.test(values.phone))
    errors.phone = 'Enter a valid phone number.';
  else if (values.phone && (values.phone.replace(/\D/g, '').length < 10 || values.phone.replace(/\D/g, '').length > 15))
    errors.phone = 'Use 10–15 digits, including your area code.';
  if (values.state && !/^[A-Za-z]{2}$/.test(values.state.trim()))
    errors.state = 'Use a two-letter state code.';
  if (values.zip && !/^\d{5}(-\d{4})?$/.test(values.zip.trim()))
    errors.zip = 'Enter a valid ZIP code.';
  if (values.password && values.password.length < 12)
    errors.password = 'Use at least 12 characters.';
  if (values.confirmPassword && values.password !== values.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export async function registerCustomer(values: Registration): Promise<void> {
  const endpoint = process.env.EXPO_PUBLIC_REGISTRATION_URL;
  if (!endpoint) throw new Error('Registration is not connected yet. Your account has not been created. Please try again once the service is available.');
  if (!endpoint.startsWith('https://')) throw new Error('Registration requires a secure connection. Please contact support.');
  const { confirmPassword: _confirmation, ...payload } = values;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, fullName: payload.fullName.trim(), email: payload.email.trim().toLowerCase(), phone: payload.phone.trim(), address: payload.address.trim(), city: payload.city.trim(), state: payload.state.trim().toUpperCase(), zip: payload.zip.trim() }),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 409) throw new Error('An account with this email already exists. Please use a different email.');
      throw new Error('We could not create your account. Please try again.');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    if (error instanceof TypeError) throw new Error('Unable to connect. Check your internet connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
