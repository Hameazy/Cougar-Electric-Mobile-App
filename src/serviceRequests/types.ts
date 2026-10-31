export type ServiceLocation = {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
};

export type ServiceRequestDraft = {
  description: string;
  location?: ServiceLocation;
};
