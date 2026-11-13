import { Redirect } from 'expo-router';
import { useServiceRequestDraft } from '../serviceRequests/ServiceRequestDraftProvider';

// Kept as a compatibility route for stale navigation history and deep links.
// Timing now belongs to the Tell Us More screen.
export default function SchedulePreference() {
  const { draft } = useServiceRequestDraft();

  return (
    <Redirect
      href={draft.issueType
        ? '/emergency-description?section=timing'
        : '/choose-electrical-issue'}
    />
  );
}
