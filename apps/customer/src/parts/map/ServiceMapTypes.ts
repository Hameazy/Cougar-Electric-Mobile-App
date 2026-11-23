import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type MapPoint = { latitude: number; longitude: number };

export type MapMarker = MapPoint & {
  id: string;
  kind: 'technician' | 'charger';
  // short text drawn inside the pin (initials for technicians)
  label: string;
  // read out by screen readers
  title: string;
  // technicians only: 'busy' pins are grey so available ones stand out
  tone?: 'available' | 'busy';
};

// Where the customer is right now (the blue dot). accuracyMeters draws the soft circle.
export type UserLocationPoint = MapPoint & { accuracyMeters?: number };

// 'dark' matches the app, 'streets' is a bright, colorful street map.
export type MapTheme = 'dark' | 'streets';

// Web only: did the street tiles load? The screen shows a message if not.
export type TileStatus = 'ok' | 'failed';

// Things the screen can ask the map to do (zoom buttons, "locate me", "show all").
export type ServiceMapHandle = {
  zoomBy: (steps: number) => void;
  panTo: (point: MapPoint) => void;
  showAll: () => void;
};

// ServiceMap.tsx (phones) and ServiceMap.web.tsx (browser) both take these
// same props, so the screens using the map don't care which one they get.
export type ServiceMapProps = {
  center: MapPoint;
  markers: MapMarker[];
  selectedId?: string;
  onSelectMarker?: (id: string) => void;
  onPressMap?: () => void;
  // when set, the service location pin can be dragged; called with where it was dropped
  onServicePinMove?: (point: MapPoint) => void;
  // called with the new map center after the customer pans or zooms the map
  // (not for moves the map makes by itself, see SELF_MOVE_GRACE_MS)
  onMapMoved?: (center: MapPoint) => void;
  // the real road path from the picked electrician to the service location
  routePath?: MapPoint[];
  // fallback when there is no road path: a dashed straight line to this point
  routeTo?: MapPoint;
  userLocation?: UserLocationPoint;
  // false before the customer has picked a location (no gold home pin yet)
  showServiceLocation?: boolean;
  // distance rings around the service location, in miles
  rings?: number[];
  // false = a still preview (no dragging or zooming), used on the dashboard
  interactive?: boolean;
  // keep pins from hiding under the sheet, the top bar and the side panel
  bottomInset?: number;
  topInset?: number;
  leftInset?: number;
  rightInset?: number;
  theme?: MapTheme;
  onTileStatus?: (status: TileStatus) => void;
  ref?: Ref<ServiceMapHandle>;
  style?: StyleProp<ViewStyle>;
};

export const MILES_TO_METERS = 1609.34;

// After the map moves itself (zoom-to-fit, fly-to, zoom buttons), ignore move
// events for this long so they aren't reported as the customer moving the map.
export const SELF_MOVE_GRACE_MS = 1000;

// A point straight north of the center, used to place the "5 mi" ring labels.
export function pointNorthOf(center: MapPoint, miles: number): MapPoint {
  return { latitude: center.latitude + miles / 69, longitude: center.longitude };
}

export const MAP_COLORS = {
  night: '#070B13',
  land: '#0D1422',
  panel: '#111722',
  line: '#3A4250',
  volt: '#F5B900',
  available: '#7EE2A8',
  busy: '#8290A6',
  charger: '#9B7BFF',
  you: '#3B82F6',
  text: '#F8FAFC',
  muted: '#8290A6',
};
