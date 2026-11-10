import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Attachment } from '../helpers/AttachmentRules';
import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';
import type { RequestTiming, SchedulePreference, ServiceLocation, ServiceRequestDraft } from './ServiceRequestTypes';

const EMPTY_DRAFT: ServiceRequestDraft = { timing: 'asap', issueType: null, description: '', attachments: [] };

const DraftContext = createContext<{
  draft: ServiceRequestDraft;
  setTiming: (timing: RequestTiming) => void;
  setSchedulePreference: (schedulePreference: SchedulePreference) => void;
  setIssueType: (issueType: ElectricalIssue) => void;
  setLocation: (location: ServiceLocation) => void;
  setDescription: (description: string) => void;
  setAttachments: (attachments: Attachment[]) => void;
  resetDraft: () => void;
} | null>(null);

// Request-session state: navigation must not discard unfinished descriptions.
// The submission workflow should call resetDraft after success or explicit cancellation.
export function ServiceRequestDraftProvider({ children }: { children?: ReactNode }) {
  const [draft, setDraft] = useState<ServiceRequestDraft>(EMPTY_DRAFT);
  return (
    <DraftContext.Provider value={{
      draft,
      setTiming: (timing) => setDraft((current) => ({ ...current, timing })),
      setSchedulePreference: (schedulePreference) => setDraft((current) => ({ ...current, schedulePreference })),
      setIssueType: (issueType) => setDraft((current) => ({ ...current, issueType })),
      setLocation: (location) => setDraft((current) => ({ ...current, location })),
      setDescription: (description) => setDraft((current) => ({ ...current, description })),
      setAttachments: (attachments) => setDraft((current) => ({ ...current, attachments })),
      resetDraft: () => setDraft(EMPTY_DRAFT),
    }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useServiceRequestDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('Service request draft provider is missing.');
  return context;
}
