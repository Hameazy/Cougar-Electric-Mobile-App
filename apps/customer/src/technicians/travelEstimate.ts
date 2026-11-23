// Two different numbers show up on the map, and they are NOT the same thing:
//
// 1. Straight-line distance ("as the crow flies"). Always available. It comes
//    from the two coordinates (distance.ts) and ignores roads completely.
// 2. Driving time. This needs road data. When the routing service answers
//    (routing.ts) we show its real road distance and time. When it can't (offline,
//    service busy) we fall back to the rough guess below and label it an estimate.
//
// The rough guess pads the straight line a little (roads are never straight) and
// assumes about 30 mph of city driving, plus a couple of minutes to get going.
const ROAD_FACTOR = 1.3;
const AVERAGE_SPEED_MPH = 30;
const START_UP_MINUTES = 2;

export type DriveInfo = {
  minutes: number;
  // road distance in miles. Only known when the time came from a real route.
  roadMiles?: number;
  source: 'road' | 'estimate';
};

export function estimateDriveMinutes(distanceMiles: number): number {
  if (!Number.isFinite(distanceMiles) || distanceMiles < 0) return 0;

  const drivingMinutes = ((distanceMiles * ROAD_FACTOR) / AVERAGE_SPEED_MPH) * 60;
  return Math.max(1, Math.round(drivingMinutes + START_UP_MINUTES));
}

// Picks the real road time when we have it, otherwise the rough guess.
export function driveInfoFor(
  straightLineMiles: number,
  road?: { minutes: number; roadMiles: number },
): DriveInfo {
  if (road) return { minutes: Math.max(1, road.minutes), roadMiles: road.roadMiles, source: 'road' };
  return { minutes: estimateDriveMinutes(straightLineMiles), source: 'estimate' };
}

export function formatDriveTime(minutes: number): string {
  if (minutes < 60) return `about ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const leftover = minutes % 60;
  return leftover ? `about ${hours} hr ${leftover} min` : `about ${hours} hr`;
}

// Short version for tight spots like list rows: "12 min" or "1 hr 5 min".
export function formatShortMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const leftover = minutes % 60;
  return leftover ? `${hours} hr ${leftover} min` : `${hours} hr`;
}

export function formatMiles(distanceMiles: number): string {
  if (distanceMiles < 0.1) return 'under 0.1 mi';
  return `${distanceMiles.toFixed(1)} mi`;
}
