// TEMPORARY demo electricians so the map can be tried before real technician
// accounts exist in Firestore. They are made up, placed around whatever spot the
// customer is looking at, and the screen labels them "Demo" everywhere.
//
// Off by default. Turn on by adding this line to .env and restarting Expo:
//   EXPO_PUBLIC_DEMO_TECHNICIANS=true
// Even when it's on, demo electricians only show up if Firestore has no real
// available technicians, so they never get mixed in with real data.
import { distanceInMiles } from './distance';
import type { MapTechnician } from './technicianFilters';

export const DEMO_TECHNICIANS_ENABLED = process.env.EXPO_PUBLIC_DEMO_TECHNICIANS === 'true';

const MILES_PER_DEGREE_LATITUDE = 69;

type DemoSeed = {
  name: string;
  rating: number;
  jobsCompleted: number;
  specialties: string[];
  evCertified?: boolean;
  availability: 'available' | 'busy';
  // how far north and east of the customer, in miles (negative = south / west)
  north: number;
  east: number;
};

const DEMO_SEEDS: DemoSeed[] = [
  { name: 'Marcus Reed', rating: 4.9, jobsCompleted: 412, specialties: ['Panel upgrades', 'Outages'], availability: 'available', north: 0.8, east: 0.6 },
  { name: 'Dana Lopez', rating: 4.8, jobsCompleted: 268, specialties: ['EV charger install', 'Wiring'], evCertified: true, availability: 'available', north: -1.9, east: 1.4 },
  { name: 'Priya Shah', rating: 4.7, jobsCompleted: 190, specialties: ['Lighting', 'Outlets'], availability: 'available', north: 2.6, east: -2.2 },
  { name: 'Tom Nguyen', rating: 4.5, jobsCompleted: 96, specialties: ['EV charger install', 'Panel upgrades'], evCertified: true, availability: 'busy', north: -3.1, east: -1.2 },
  { name: 'Sam Carter', rating: 4.3, jobsCompleted: 41, specialties: ['Troubleshooting'], availability: 'available', north: 4.4, east: 3.1 },
  { name: 'Lena Brooks', rating: 4.9, jobsCompleted: 530, specialties: ['EV charger install', 'Generators'], evCertified: true, availability: 'available', north: -5.6, east: -4.0 },
  { name: 'Omar Haddad', rating: 4.6, jobsCompleted: 153, specialties: ['Outages', 'Wiring'], availability: 'busy', north: 6.2, east: -5.1 },
  { name: 'Grace Kim', rating: 4.4, jobsCompleted: 77, specialties: ['Lighting', 'Smoke detectors'], availability: 'available', north: 9.5, east: 6.0 },
];

export function makeDemoTechnicians(center: { latitude: number; longitude: number }): MapTechnician[] {
  const milesPerDegreeLongitude = MILES_PER_DEGREE_LATITUDE * Math.cos((center.latitude * Math.PI) / 180);

  return DEMO_SEEDS
    .map((seed, index): MapTechnician => {
      const latitude = center.latitude + seed.north / MILES_PER_DEGREE_LATITUDE;
      const longitude = center.longitude + seed.east / milesPerDegreeLongitude;
      return {
        id: `demo-${index + 1}`,
        name: seed.name,
        rating: seed.rating,
        jobsCompleted: seed.jobsCompleted,
        specialties: seed.specialties,
        evCertified: seed.evCertified,
        availability: seed.availability,
        latitude,
        longitude,
        distanceMiles: distanceInMiles(center, { latitude, longitude }),
        isDemo: true,
      };
    })
    .sort((left, right) => left.distanceMiles - right.distanceMiles);
}
