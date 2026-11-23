// Asks for the phone's / browser's GPS in a polite way and explains what went
// wrong when it can't. All the permission handling lives here so the map page
// only has to deal with "got a point" or "here is a message for the person".
import * as Location from 'expo-location';
import type { MapPoint } from '../parts/map/ServiceMapTypes';

export type DeviceLocationFailure = 'denied' | 'blocked' | 'services-off' | 'timeout' | 'error';

export type DeviceLocationResult =
  | { ok: true; point: MapPoint; accuracyMeters?: number }
  | { ok: false; reason: DeviceLocationFailure; message: string };

const GPS_TIMEOUT_MS = 12000;

export const FAILURE_MESSAGES: Record<DeviceLocationFailure, string> = {
  denied: 'Location permission was not allowed. You can still search for an address.',
  blocked: 'Location is turned off for Cougar Electric. Turn it on in your settings, or search for an address.',
  'services-off': 'Location services are turned off on this device. Turn them on, or search for an address.',
  timeout: 'We could not get a GPS signal in time. Try again outside, or search for an address.',
  error: 'We could not find your location. Try again or search for an address.',
};

function fail(reason: DeviceLocationFailure): DeviceLocationResult {
  return { ok: false, reason, message: FAILURE_MESSAGES[reason] };
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    work.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

export async function getDeviceLocation(): Promise<DeviceLocationResult> {
  try {
    // only show the permission pop-up if we don't already have an answer
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      if (!permission.canAskAgain) return fail('blocked');
      permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return fail(permission.canAskAgain ? 'denied' : 'blocked');
      }
    }

    if (!(await Location.hasServicesEnabledAsync())) return fail('services-off');

    // First try for a precise fix. If the GPS is slow (indoors), settle for a
    // rougher one instead of making the person wait forever.
    let position: Location.LocationObject | null = null;
    try {
      position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        GPS_TIMEOUT_MS,
      );
    } catch {
      try {
        position = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          GPS_TIMEOUT_MS,
        );
      } catch {
        // last chance: a recent saved position (phones only, the browser has none)
        position = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 }).catch(() => null);
      }
    }

    if (!position) return fail('timeout');

    return {
      ok: true,
      point: { latitude: position.coords.latitude, longitude: position.coords.longitude },
      accuracyMeters: position.coords.accuracy ?? undefined,
    };
  } catch {
    return fail('error');
  }
}
