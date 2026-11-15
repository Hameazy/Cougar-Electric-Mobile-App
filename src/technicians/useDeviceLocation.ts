// The customer's real GPS position, with the permission question handled.
//
// Call locate() from a button press. It asks for permission, gets the first
// position, then keeps the blue "you are here" dot updating while the screen is
// open. Every way it can go wrong becomes a plain message the screen can show.
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type DevicePosition = {
  latitude: number;
  longitude: number;
  // how sure the phone is, in meters (smaller = better). Drawn as a soft circle.
  accuracyMeters?: number;
};

export type DeviceLocationStatus =
  | 'idle' // never asked
  | 'locating' // permission prompt or first fix in progress
  | 'ready' // we have a position
  | 'denied' // customer said no (can ask again)
  | 'blocked' // customer said no and the system won't ask again
  | 'unavailable' // location services are off or the device can't tell us
  | 'error'; // something else went wrong, try again

const FIRST_FIX_TIMEOUT_MS = 15000;

export function describeLocationProblem(status: DeviceLocationStatus, onWeb: boolean): string {
  switch (status) {
    case 'denied':
      return 'Location permission is off. Allow it when asked, or search an address instead.';
    case 'blocked':
      return onWeb
        ? 'Location is blocked for this site. Click the lock icon in the address bar, allow Location, then try again.'
        : 'Location is turned off for this app. Open Settings, allow Location, then try again.';
    case 'unavailable':
      return onWeb
        ? 'Your browser could not get a location. Check that Location is on for this device, or search an address.'
        : 'Location Services are off on this phone. Turn them on, or search an address instead.';
    case 'error':
      return 'We could not find your location. Try again, or search an address instead.';
    default:
      return '';
  }
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), milliseconds);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

function toPosition(location: Location.LocationObject): DevicePosition {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: location.coords.accuracy ?? undefined,
  };
}

export function useDeviceLocation() {
  const [status, setStatus] = useState<DeviceLocationStatus>('idle');
  const [position, setPosition] = useState<DevicePosition | undefined>();
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const mounted = useRef(true);

  const stopWatching = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopWatching();
    };
  }, [stopWatching]);

  // Resolves with the first position, or undefined if we couldn't get one.
  const locate = useCallback(async (): Promise<DevicePosition | undefined> => {
    setStatus('locating');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return undefined;
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setStatus(permission.canAskAgain ? 'denied' : 'blocked');
        return undefined;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        if (mounted.current) setStatus('unavailable');
        return undefined;
      }

      const first = toPosition(await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        FIRST_FIX_TIMEOUT_MS,
      ));
      if (!mounted.current) return undefined;
      setPosition(first);
      setStatus('ready');

      // keep the blue dot moving (only starts once, even if locate() is pressed again)
      if (!watcher.current) {
        watcher.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          (update) => { if (mounted.current) setPosition(toPosition(update)); },
        );
        // the screen may have closed while we were setting up the watcher
        if (!mounted.current) stopWatching();
      }
      return first;
    } catch (error) {
      if (!mounted.current) return undefined;
      const code = error instanceof Error ? (error as { code?: string }).code : undefined;
      setStatus(code === 'E_LOCATION_UNAVAILABLE' || code === 'E_LOCATION_SETTINGS_UNSATISFIED' ? 'unavailable' : 'error');
      return undefined;
    }
  }, [stopWatching]);

  return { status, position, locate };
}
