// Reads what the Photon geocoder sends back. Kept separate from geocoding.ts (which
// does the network calls) so the parsing can be tested without React Native.
import type { MapPoint } from '../parts/map/ServiceMapTypes';

export type Place = MapPoint & {
  id: string;
  // first line, like "1400 Pine St" or "Sacramento"
  title: string;
  // second line, like "Davis, California 95616"
  subtitle: string;
};

type PhotonProperties = {
  osm_id?: number;
  osm_type?: string;
  osm_key?: string;
  name?: string;
  housenumber?: string;
  street?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// "House number + street" if we have a street, otherwise nothing
function streetLine(properties: PhotonProperties): string {
  const street = clean(properties.street);
  if (!street) return '';
  return [clean(properties.housenumber), street].filter(Boolean).join(' ');
}

function cityName(properties: PhotonProperties): string {
  return clean(properties.city) || clean(properties.district) || clean(properties.county);
}

function stateAndZip(properties: PhotonProperties): string {
  return [clean(properties.state), clean(properties.postcode)].filter(Boolean).join(' ');
}

// "Davis, California 95616"
function cityLine(properties: PhotonProperties): string {
  return [cityName(properties), stateAndZip(properties)].filter(Boolean).join(', ');
}

// Reads Photon's GeoJSON answer. Anything that looks wrong is skipped instead of
// crashing the search box.
export function parsePhotonPlaces(json: unknown): Place[] {
  const features = (json as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) return [];

  const places: Place[] = [];
  const seen = new Set<string>();

  features.forEach((feature, index) => {
    const coordinates = (feature as { geometry?: { coordinates?: unknown } })?.geometry?.coordinates;
    const properties = ((feature as { properties?: PhotonProperties })?.properties ?? {}) as PhotonProperties;
    if (!Array.isArray(coordinates)) return;

    // GeoJSON order is [longitude, latitude]
    const longitude = coordinates[0];
    const latitude = coordinates[1];
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;

    const name = clean(properties.name);
    const street = streetLine(properties);
    const city = cityLine(properties);

    // A shop or landmark keeps its own name on line one and the street on line two.
    // A plain address (or a street / town) just uses the address.
    const isNamedPlace = !!name && name !== clean(properties.street) && properties.osm_key !== 'place' && properties.osm_key !== 'highway';
    const title = isNamedPlace ? name : street || name || city;
    // when the result is a town itself, don't repeat its name on the second line
    const subtitle = isNamedPlace
      ? [street, city].filter(Boolean).join(', ')
      : street
        ? city
        : cityName(properties) === title
          ? stateAndZip(properties) || clean(properties.country)
          : city;
    if (!title) return;

    const key = `${title}|${subtitle}`;
    if (seen.has(key)) return;
    seen.add(key);

    places.push({
      id: `${properties.osm_type ?? 'x'}${properties.osm_id ?? index}`,
      title,
      subtitle,
      latitude,
      longitude,
    });
  });

  return places;
}

// One line to show in the address chip, like "1400 Pine St, Davis"
export function describePhotonPoint(json: unknown): string {
  const [first] = parsePhotonPlaces(json);
  if (!first) return '';
  const town = first.subtitle.split(',')[0]?.trim();
  return first.subtitle && first.subtitle !== town && town ? `${first.title}, ${town}` : [first.title, first.subtitle].filter(Boolean).join(', ');
}
