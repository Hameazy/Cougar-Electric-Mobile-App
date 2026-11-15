export type TechnicianAvailability = 'available';

export type AvailableTechnician = {
  id: string;
  name: string;
  rating?: number;
  latitude: number;
  longitude: number;
  availability: TechnicianAvailability;
  // Optional profile details for the CE-34 map. Older technician documents
  // don't have these, so every one of them may be missing.
  specialties?: string[];
  evCertified?: boolean;
  jobsCompleted?: number;
};

export type RankedTechnician = AvailableTechnician & {
  distanceMiles: number;
};
