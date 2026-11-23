// Real driving routes and drive times, from an OSRM routing server.
//
// Why this exists: straight-line distance is not how long it takes to drive.
// OSRM knows the road network, so it can tell us the road distance, the drive
// time, and the actual path to draw on the map.
//
// No API key is needed for the free public demo server below, but that server is
// only meant for light testing (no guarantees, fair use only). For a real
// launch, point EXPO_PUBLIC_ROUTING_URL in .env at your own OSRM server or a
// paid routing provider that speaks the same OSRM format. Never put a secret key
// in this file.
const ROUTING_URL = (process.env.EXPO_PUBLIC_ROUTING_URL || 'https://router.project-osrm.org').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;
const METERS_PER_MILE = 1609.34;
// the "table" request below handles a whole list in one call, but we keep it short
export const MAX_DRIVE_TIME_LOOKUPS = 12;

type Point = { latitude: number; longitude: number };

export type RoadRoute = {
  roadMiles: number;
  minutes: number;
  // the road path from the technician to the customer, ready to draw
  path: Point[];
};

export type RoadTime = { minutes: number; roadMiles: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

// OSRM wants "longitude,latitude" (backwards from how people say it).
function coordinateText(point: Point): string {
  return `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`;
}

// ---------- reading the answers (pure functions, covered by tests) ----------

export function parseRoute(body: unknown): RoadRoute | null {
  if (!isRecord(body) || body.code !== 'Ok' || !Array.isArray(body.routes)) return null;
  const route: unknown = body.routes[0];
  if (!isRecord(route)) return null;

  const meters = readNumber(route.distance);
  const seconds = readNumber(route.duration);
  const geometry = route.geometry;
  if (meters === undefined || seconds === undefined || !isRecord(geometry) || !Array.isArray(geometry.coordinates)) {
    return null;
  }

  const path: Point[] = [];
  for (const pair of geometry.coordinates as unknown[]) {
    if (!Array.isArray(pair)) continue;
    const longitude = readNumber(pair[0]);
    const latitude = readNumber(pair[1]);
    if (latitude !== undefined && longitude !== undefined) path.push({ latitude, longitude });
  }
  if (path.length < 2) return null;

  return { roadMiles: meters / METERS_PER_MILE, minutes: toMinutes(seconds), path };
}

// One entry per technician, in the same order we asked. null = no road route
// exists for that one (for example an island or a point far from any road).
export function parseDriveTimes(body: unknown, count: number): (RoadTime | null)[] {
  const empty = Array.from({ length: count }, () => null);
  if (!isRecord(body) || body.code !== 'Ok' || !Array.isArray(body.durations) || !Array.isArray(body.distances)) {
    return empty;
  }

  return empty.map((_, index) => {
    const durationRow: unknown = (body.durations as unknown[])[index];
    const distanceRow: unknown = (body.distances as unknown[])[index];
    const seconds = Array.isArray(durationRow) ? readNumber(durationRow[0]) : undefined;
    const meters = Array.isArray(distanceRow) ? readNumber(distanceRow[0]) : undefined;
    if (seconds === undefined || meters === undefined) return null;
    return { minutes: toMinutes(seconds), roadMiles: meters / METERS_PER_MILE };
  });
}

// ---------- asking the server ----------

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  // our own 10 second timeout, plus the caller's signal (screen closed / new search)
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const forwardAbort = () => timeout.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    const response = await fetch(url, { signal: timeout.signal });
    if (!response.ok) throw new Error(`Routing service answered ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

// The road path and drive time from one technician to the customer.
export async function fetchRoadRoute(from: Point, to: Point, signal?: AbortSignal): Promise<RoadRoute | null> {
  const url = `${ROUTING_URL}/route/v1/driving/${coordinateText(from)};${coordinateText(to)}?overview=full&geometries=geojson`;
  return parseRoute(await getJson(url, signal));
}

// Drive times from many technicians to the customer in ONE request.
export async function fetchDriveTimes(
  customer: Point,
  technicians: Point[],
  signal?: AbortSignal,
): Promise<(RoadTime | null)[]> {
  if (technicians.length === 0) return [];

  const points = [...technicians, customer];
  const coordinates = points.map(coordinateText).join(';');
  const sources = technicians.map((_, index) => index).join(';');
  const url = `${ROUTING_URL}/table/v1/driving/${coordinates}?sources=${sources}&destinations=${technicians.length}&annotations=duration,distance`;
  return parseDriveTimes(await getJson(url, signal), technicians.length);
}
