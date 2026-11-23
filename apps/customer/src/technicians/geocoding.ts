// Turns an address into map coordinates (search) and coordinates back into an
// address (so "Your current location" can show a street name).
//
// Uses Nominatim, the free search service of OpenStreetMap. No API key. Their
// rules (https://operations.osmfoundation.org/policies/nominatim/): at most 1
// request per second, no search-as-you-type, and apps must identify themselves.
// That's why we only search when the customer presses Search / Enter, and why the
// phone version sends a User-Agent. For a real launch, point
// EXPO_PUBLIC_GEOCODER_URL in .env at a paid geocoder that speaks the same format.
// Never put a secret key in this file.
import { Platform } from 'react-native';
import { parsePlaceMatches, shortLabel, type PlaceMatch } from './placeParsing';

export type { PlaceMatch };

const GEOCODER_URL = (process.env.EXPO_PUBLIC_GEOCODER_URL || 'https://nominatim.openstreetmap.org').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RESULTS = 5;

type Point = { latitude: number; longitude: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const forwardAbort = () => timeout.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    // Browsers set their own User-Agent and send the site address as the referer,
    // which is how Nominatim identifies web apps. Phones need to say who they are.
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (Platform.OS !== 'web') headers['User-Agent'] = 'CougarElectricStudentApp/1.0 (Sacramento State senior project)';

    const response = await fetch(url, { signal: timeout.signal, headers });
    if (response.status === 429) throw new Error('Too many searches. Wait a few seconds and try again.');
    if (!response.ok) throw new Error(`Address search answered ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

export async function searchPlaces(text: string, signal?: AbortSignal): Promise<PlaceMatch[]> {
  const params = new URLSearchParams({
    q: text.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(MAX_RESULTS),
    countrycodes: 'us',
  });
  return parsePlaceMatches(await getJson(`${GEOCODER_URL}/search?${params.toString()}`, signal));
}

// Street name for a GPS point. Only used for a nicer label, so any failure is
// fine, we just keep showing "Your current location".
export async function describePoint(point: Point, signal?: AbortSignal): Promise<string | undefined> {
  const params = new URLSearchParams({
    lat: point.latitude.toFixed(6),
    lon: point.longitude.toFixed(6),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
  });

  try {
    const body = await getJson(`${GEOCODER_URL}/reverse?${params.toString()}`, signal);
    return isRecord(body) && !body.error ? shortLabel(body) : undefined;
  } catch {
    return undefined;
  }
}
