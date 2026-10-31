import type { ServiceLocation } from '../serviceRequests/types';

export type LocationErrors = Partial<Record<keyof ServiceLocation, string>>;

export function validateServiceLocation(location: ServiceLocation): LocationErrors {
  const errors: LocationErrors = {};

  if (!location.address.trim()) errors.address = 'Enter the service street address.';
  if (!location.city.trim()) errors.city = 'Enter the service city.';
  if (!/^[A-Za-z]{2}$/.test(location.state.trim())) errors.state = 'Use a two-letter state code.';
  if (!/^\d{5}(-\d{4})?$/.test(location.zip.trim())) errors.zip = 'Enter a valid ZIP code.';

  return errors;
}

export function validateIssueDescription(description: string): string | undefined {
  const value = description.trim();
  if (!value) return 'Describe the electrical problem before continuing.';
  if (value.length < 10) return 'Please provide at least 10 characters.';
  return undefined;
}
