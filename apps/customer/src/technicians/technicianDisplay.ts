// Small helpers that turn a technician's distance into the text on the map cards.
// The drive time is only a rough guess (we don't call a routing service), so the
// cards always say "about".

const ROAD_FACTOR = 1.3; // roads are longer than the straight line between two points
const CITY_MPH = 30;
const START_UP_MINUTES = 2; // time to wrap up, grab the van and leave

export function estimateDriveMinutes(distanceMiles: number): number {
  if (!Number.isFinite(distanceMiles) || distanceMiles < 0) return 0;
  return Math.round((distanceMiles * ROAD_FACTOR * 60) / CITY_MPH + START_UP_MINUTES);
}

// "8 min" for the little bubble above a pin
export function formatShortTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

// "about 8 min" for sentences
export function formatDriveTime(minutes: number): string {
  return `about ${formatShortTime(minutes)}`;
}

export function formatMiles(miles: number): string {
  if (!Number.isFinite(miles)) return '';
  if (miles < 0.1) return 'under 0.1 mi';
  return `${miles.toFixed(1)} mi`;
}

// "Marcus Reed" -> "MR", "Sam" -> "S"
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase());
  if (letters.length === 0) return '?';
  return letters.length === 1 ? letters[0]! : `${letters[0]}${letters[letters.length - 1]}`;
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function formatRatingShort(rating?: number): string {
  return rating !== undefined && rating >= 0 && rating <= 5 ? rating.toFixed(1) : 'New';
}
