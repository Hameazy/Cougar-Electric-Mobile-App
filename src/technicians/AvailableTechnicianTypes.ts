export type TechnicianAvailability = 'available';

export type AvailableTechnician = {
  id: string;
  name: string;
  rating?: number;
  latitude: number;
  longitude: number;
  availability: TechnicianAvailability;
};

export type RankedTechnician = AvailableTechnician & {
  distanceMiles: number;
};
