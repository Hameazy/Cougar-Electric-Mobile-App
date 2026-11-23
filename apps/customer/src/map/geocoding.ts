// Turns typed text into map points (and map points back into an address).
//
// We use Photon (photon.komoot.io), a free search service built on OpenStreetMap
// data. It needs no API key and it works in the browser too. The phone's built-in
// geocoder (expo-location) is only used as a backup, because expo-location's
// geocoding doesn't work on the web at all.
//
// The public Photon server is meant for light use, so the search box waits for
// the person to stop typing before it asks (see MapSearchBar). For a real launch
// the team should host its own copy or switch to a paid geocoder.
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { MapPoint } from '../parts/map/ServiceMapTypes';
import { describePhotonPoint, parsePhotonPlaces, type Place } from './placeParsing';

export type { Place } from './placeParsing';

const PHOTON_URL = 'https://photon.komoot.io';

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Geocoder answered ${response.status}`);
  return response.json();
}

export async function searchPlaces(text: string, near?: MapPoint, signal?: AbortSignal): Promise<Place[]> {
  const query = text.trim();
  if (query.length < 3) return [];

  const params = new URLSearchParams({ q: query, limit: '6', lang: 'en' });
  // prefer results close to where the map already is
  if (near) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }

  try {
    return parsePhotonPlaces(await getJson(`${PHOTON_URL}/api/?${params.toString()}`, signal));
  } catch (error) {
    // the person kept typing, so this request was cancelled on purpose
    if (signal?.aborted) throw error;
    if (Platform.OS === 'web') throw error;

    // Backup on phones: the phone's own geocoder. It only gives coordinates back.
    const found = await Location.geocodeAsync(query);
    return found.slice(0, 3).map((item, index) => ({
      id: `device-${index}`,
      title: query,
      subtitle: 'Found by your phone',
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  }
}

// Works out a readable address for a GPS point. Returns '' if nothing is found,
// the caller then shows "Pinned location" instead.
export async function describePoint(point: MapPoint, signal?: AbortSignal): Promise<string> {
  // Phones: ask the phone first, it knows its own maps well and works offline-ish
  if (Platform.OS !== 'web') {
    try {
      const [address] = await Location.reverseGeocodeAsync(point);
      if (address) {
        const line = address.street ? [address.streetNumber, address.street].filter(Boolean).join(' ') : address.name ?? '';
        const town = address.city || address.subregion || '';
        const text = [line, town].filter(Boolean).join(', ');
        if (text) return text;
      }
    } catch {
      // fall through to Photon
    }
  }

  try {
    const params = new URLSearchParams({ lat: String(point.latitude), lon: String(point.longitude), lang: 'en' });
    return describePhotonPoint(await getJson(`${PHOTON_URL}/reverse?${params.toString()}`, signal));
  } catch {
    return '';
  }
}
