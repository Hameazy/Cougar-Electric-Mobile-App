import type { ServiceRequestDraft } from './ServiceRequestTypes';
import type { ServiceRequestInput } from './validateServiceRequestSubmission';

// Preserve the customer's text while editing; normalize only the submission copy.
export function withDraftDescription(
  draft: Pick<ServiceRequestDraft, 'description'>,
  request: Omit<ServiceRequestInput, 'description'>,
): ServiceRequestInput {
  return { ...request, description: draft.description.trim() };
}
