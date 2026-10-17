import type { RegistrationFormValues, RegistrationRequest } from '../auth/types';

export type Registration = RegistrationFormValues;

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

export function createRegistrationRequest(values: Registration): RegistrationRequest {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    zip: values.zip.trim(),
    password: values.password,
  };
}
