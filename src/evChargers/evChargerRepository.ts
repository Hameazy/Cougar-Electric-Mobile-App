// Public EV charging stations come from the U.S. Department of Energy's
// Alternative Fuel Station API (run by NREL). It's free: get your own key at
// https://developer.nrel.gov/signup and put it in .env as
// EXPO_PUBLIC_NREL_API_KEY. Without a key we fall back to DEMO_KEY, which works
// for testing but only allows a few requests per hour.
const NREL_NEAREST_URL = 'https://developer.nlr.gov/api/alt-fuel-stations/v1/nearest.json';
const SEARCH_RADIUS_MILES = 10;
const MAX_CHARGERS = 20;

export type EvCharger = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  level2Ports: number;
  fastPorts: number;
  network?: string;
  hours?: string;
};

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readCharger(station: Record<string, unknown>): EvCharger | null {
  const latitude = readNumber(station.latitude);
  const longitude = readNumber(station.longitude);
  const name = readText(station.station_name);
  if (latitude === undefined || longitude === undefined || !name) return null;

  const street = readText(station.street_address);
  const city = readText(station.city);
  const network = readText(station.ev_network);

  return {
    id: String(station.id ?? `${latitude},${longitude}`),
    name,
    address: [street, city].filter(Boolean).join(', '),
    latitude,
    longitude,
    distanceMiles: readNumber(station.distance) ?? 0,
    level2Ports: readNumber(station.ev_level2_evse_num) ?? 0,
    fastPorts: readNumber(station.ev_dc_fast_num) ?? 0,
    // "Non-Networked" just means a plain charger with no app, so we hide it
    network: network && network !== 'Non-Networked' ? network : undefined,
    hours: readText(station.access_days_time),
  };
}

export async function fetchNearbyEvChargers(
  location: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<EvCharger[]> {
  const params = new URLSearchParams({
    api_key: process.env.EXPO_PUBLIC_NREL_API_KEY || 'DEMO_KEY',
    latitude: location.latitude.toFixed(5),
    longitude: location.longitude.toFixed(5),
    radius: String(SEARCH_RADIUS_MILES),
    fuel_type: 'ELEC',
    status: 'E',
    access: 'public',
    limit: String(MAX_CHARGERS),
  });

  const response = await fetch(`${NREL_NEAREST_URL}?${params.toString()}`, { signal });

  if (response.status === 429) {
    throw new Error('Too many EV charger lookups right now. Try again in a few minutes.');
  }
  if (!response.ok) {
    throw new Error('EV chargers could not be loaded. Check your connection and try again.');
  }

  const body: unknown = await response.json();
  const stations = body && typeof body === 'object' && 'fuel_stations' in body
    ? (body as { fuel_stations: unknown }).fuel_stations
    : [];

  if (!Array.isArray(stations)) return [];

  return stations
    .map((station) => (station && typeof station === 'object' ? readCharger(station as Record<string, unknown>) : null))
    .filter((charger): charger is EvCharger => charger !== null);
}
