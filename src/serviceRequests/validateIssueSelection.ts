import type { ServiceRequestDraft } from './types';

export function canContinueWithIssue(draft: ServiceRequestDraft): boolean {
  if (!draft.issueType) return false;
  if (draft.issueType !== 'Other electrical issue') return true;
  const length = draft.description.trim().length;
  return length >= 10 && length <= 500;
}
