// Reads Nominatim answers. Kept apart from geocoding.ts (which makes the network
// calls) so it can be tested without a phone or browser.

export type PlaceMatch = {
  latitude: number;
  longitude: number;
  // short, readable name for the search bar, e.g. "6000 J St, Sacramento"
  label: string;
  // longer line to tell similar results apart, e.g. "Sacramento County, California"
  detail: string;
};

// The pieces of a street address, as saved in the request draft's ServiceLocation.
export type AddressParts = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

// Nominatim sends coordinates as text ("38.58"), so turn them into numbers.
function readCoordinate(value: unknown): number | undefined {
  const number = typeof value === 'string' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

function firstOf(address: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const text = readText(address[key]);
    if (text) return text;
  }
  return undefined;
}

// "6000, J Street, ..." -> "6000 J Street, Sacramento"
export function shortLabel(item: Record<string, unknown>): string {
  const address = isRecord(item.address) ? item.address : {};
  const street = [readText(address.house_number), readText(address.road)].filter(Boolean).join(' ');
  const town = firstOf(address, ['city', 'town', 'village', 'hamlet', 'suburb', 'county']);
  const first = street || readText(item.name);
  // "Sacramento" + "Sacramento" should read as just "Sacramento"
  const label = [first, town && town !== first ? town : undefined].filter(Boolean).join(', ');
  if (label) return label;

  const display = readText(item.display_name) ?? 'Selected location';
  return display.split(',').slice(0, 2).join(',').trim();
}

export function parsePlaceMatches(body: unknown): PlaceMatch[] {
  if (!Array.isArray(body)) return [];

  const matches: PlaceMatch[] = [];
  for (const item of body as unknown[]) {
    if (!isRecord(item)) continue;
    const latitude = readCoordinate(item.lat);
    const longitude = readCoordinate(item.lon);
    if (latitude === undefined || longitude === undefined) continue;

    const label = shortLabel(item);
    const display = readText(item.display_name) ?? label;
    // drop the part we already show as the label so the detail line adds something new
    const detail = display.split(',').slice(2).join(',').trim() || display;
    matches.push({ latitude, longitude, label, detail });
  }
  return matches;
}
