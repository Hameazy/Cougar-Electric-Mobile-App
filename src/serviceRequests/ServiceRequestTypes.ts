import type { Attachment } from '../helpers/AttachmentRules';
import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';

export type ServiceLocation = {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
};

export type RequestTiming = 'asap' | 'scheduled';
export type SchedulePreference = {
  day: 'Tomorrow' | 'Next business day' | 'This week' | "I'm flexible";
  time: 'Morning' | 'Afternoon' | 'Evening' | 'Any time';
};

export type ServiceRequestDraft = {
  timing: RequestTiming;
  schedulePreference?: SchedulePreference;
  issueType: ElectricalIssue | null;
  description: string;
  location?: ServiceLocation;
  // photos/videos picked on the description screen (still on the phone, not uploaded yet)
  attachments: Attachment[];
};
