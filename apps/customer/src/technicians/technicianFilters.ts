import type { RankedTechnician } from './AvailableTechnicianTypes';

// What the map shows for each electrician. Real technicians from Firestore are
// always 'available' (that's all the security rules let customers read). 'busy'
// only exists in the demo data so the "Available now" filter has something to hide.
export type MapTechnician = Omit<RankedTechnician, 'availability'> & {
  availability: 'available' | 'busy';
  // true for the made-up electricians from demoTechnicians.ts
  isDemo?: boolean;
};

export function toMapTechnician(technician: RankedTechnician): MapTechnician {
  return technician;
}

// "All" is not a filter, it's just no filters turned on. The others can be
// combined, e.g. "Within 5 mi" + "EV specialists".
export type TechnicianFilter = 'available' | 'close' | 'ev';

export const CLOSE_BY_MILES = 5;

export const TECHNICIAN_FILTERS: { id: TechnicianFilter; label: string }[] = [
  { id: 'available', label: 'Available now' },
  { id: 'close', label: `Within ${CLOSE_BY_MILES} mi` },
  { id: 'ev', label: 'EV specialists' },
];

export function isEvSpecialist(technician: Pick<MapTechnician, 'evCertified' | 'specialties'>): boolean {
  if (technician.evCertified) return true;
  return (technician.specialties ?? []).some((specialty) => /\bev\b|electric vehicle|charger/i.test(specialty));
}

function matchesFilter(technician: MapTechnician, filter: TechnicianFilter): boolean {
  if (filter === 'available') return technician.availability === 'available';
  if (filter === 'close') return technician.distanceMiles <= CLOSE_BY_MILES;
  return isEvSpecialist(technician);
}

// The list is already sorted nearest first (rankTechnicians), so filtering
// keeps that order. A technician has to match every turned-on filter.
export function filterTechnicians(
  technicians: MapTechnician[],
  filters: TechnicianFilter[],
): MapTechnician[] {
  if (filters.length === 0) return technicians;
  return technicians.filter((technician) => filters.every((filter) => matchesFilter(technician, filter)));
}

export function toggleFilter(filters: TechnicianFilter[], filter: TechnicianFilter): TechnicianFilter[] {
  return filters.includes(filter) ? filters.filter((item) => item !== filter) : [...filters, filter];
}

// Filter state for the chip bar in parts/map/FilterBar.tsx. Every field off
// (see EMPTY_MAP_FILTERS) means "show everyone".
export type MapFilters = {
  availableNow: boolean;
  // only electricians within this many miles, or null for any distance
  maxMiles: number | null;
  // only electricians who fit the electrical issue picked earlier in the request
  fitsIssue: boolean;
  // only electricians with this specialty, or null for any
  specialty: string | null;
};

export const EMPTY_MAP_FILTERS: MapFilters = {
  availableNow: false,
  maxMiles: null,
  fitsIssue: false,
  specialty: null,
};

// The distance chips, in miles.
export const DISTANCE_LIMITS = [5, 10, 25] as const;

export type SortMode = 'distance' | 'rating';

export const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'distance', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
];

export function activeFilterCount(filters: MapFilters): number {
  return [filters.availableNow, filters.maxMiles !== null, filters.fitsIssue, filters.specialty !== null].filter(Boolean).length;
}

export function hasActiveFilters(filters: MapFilters): boolean {
  return activeFilterCount(filters) > 0;
}

// Picks where the distance rail ends: at least 10 mi, otherwise the farthest
// technician rounded up to the next 5 mi so the last dot isn't stuck on the edge.
export function railLengthMiles(distances: number[]): number {
  const farthest = Math.max(0, ...distances);
  return Math.max(10, Math.ceil((farthest + 0.5) / 5) * 5);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

export function formatRating(rating?: number): string {
  return rating === undefined ? 'New' : `★ ${rating.toFixed(1)}`;
}
