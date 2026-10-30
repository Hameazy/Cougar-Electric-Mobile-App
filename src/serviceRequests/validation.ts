

export type ServiceRequestInput = {
  issueType: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  attachments?: string[];
};

export type ServiceRequestErrors = Partial<
  Record<keyof ServiceRequestInput, string>
>;

// Check the completed request before sending it to Firestore.
export function validateServiceRequest(
  request: ServiceRequestInput,
): ServiceRequestErrors {
  const errors: ServiceRequestErrors = {};

  if (!request.issueType.trim()) {
    errors.issueType = 'Please select an electrical issue.';
  }

  if (!request.description.trim()) {
    errors.description = 'Please describe the electrical problem.';
  }

  if (!request.address.trim()) {
    errors.address = 'Please enter your service address.';
  }

  if (!request.city.trim()) {
    errors.city = 'Please enter your city.';
  }

  if (!/^[A-Za-z]{2}$/.test(request.state.trim())) {
    errors.state = 'Please enter a valid two-letter state code.';
  }

  if (!/^\d{5}(-\d{4})?$/.test(request.zip.trim())) {
    errors.zip = 'Please enter a valid ZIP code.';
  }

  if (
    request.attachments &&
    (!Array.isArray(request.attachments) ||
      request.attachments.some(
        (attachment) =>
          typeof attachment !== 'string' || !attachment.trim(),
      ))
  ) {
    errors.attachments = 'Please check your attachments.';
  }

  return errors;
}
