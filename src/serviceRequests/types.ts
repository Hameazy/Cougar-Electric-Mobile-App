import type { ElectricalIssue } from '../helpers/CommonElectricalProblems';

export type ServiceLocation = {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
};

export type ServiceRequestDraft = {
  issueType: ElectricalIssue | null;
  description: string;
  location?: ServiceLocation;
};
