// Bridges the map and the existing request form. The request workflow already
// keeps one ServiceLocation in the shared draft (ServiceRequestDraftProvider),
// so the map saves the address there instead of asking for it a second time.
import type { ServiceLocation } from '../serviceRequests/ServiceRequestTypes';
import type { AddressParts } from './placeParsing';

type Point = { latitude: number; longitude: number };

export function toServiceLocation(point: Point, parts?: AddressParts): ServiceLocation {
  return {
    address: parts?.address ?? '',
    city: parts?.city ?? '',
    state: parts?.state ?? '',
    zip: parts?.zip ?? '',
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

// Text for the search bar when the map is opened with an address already in the draft.
export function describeLocation(location: ServiceLocation): string {
  return [location.address, location.city].filter((piece) => piece.trim()).join(', ') || 'Your service address';
}

export function hasCoordinates(location: ServiceLocation | undefined): location is ServiceLocation & Point {
  return !!location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
}

// Which screen "Request service" should open next. The issue is picked first in
// the existing flow, so someone who already chose one skips straight to the
// description (where it can still be changed).
export function nextRequestScreen(issueChosen: boolean): '/choose-electrical-issue' | '/emergency-description' {
  return issueChosen ? '/emergency-description' : '/choose-electrical-issue';
}

// How far a map move has to be before "Search this area" shows up.
export const SEARCH_AREA_MIN_MILES = 0.4;
