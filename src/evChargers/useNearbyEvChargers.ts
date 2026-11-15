import { useEffect, useState } from 'react';
import { fetchNearbyEvChargers, type EvCharger } from './evChargerRepository';

type ChargerState = {
  key?: string;
  loading: boolean;
  chargers: EvCharger[];
  errorMessage: string;
};

// Only looks chargers up when the customer turns the EV layer on, so we don't
// spend API requests on people who never use it.
export function useNearbyEvChargers(
  location: { latitude: number; longitude: number } | null,
  enabled: boolean,
) {
  const key = enabled && location ? `${location.latitude}:${location.longitude}` : undefined;
  const [state, setState] = useState<ChargerState>({ loading: false, chargers: [], errorMessage: '' });
  const [retryCount, setRetryCount] = useState(0);
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  useEffect(() => {
    if (!key || latitude === undefined || longitude === undefined) return;

    const controller = new AbortController();
    fetchNearbyEvChargers({ latitude, longitude }, controller.signal)
      .then((chargers) => setState({ key, loading: false, chargers, errorMessage: '' }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          loading: false,
          chargers: [],
          errorMessage: error instanceof Error ? error.message : 'EV chargers could not be loaded.',
        });
      });

    return () => controller.abort();
  }, [key, latitude, longitude, retryCount]);

  const retry = () => {
    setState((current) => ({ ...current, key: undefined }));
    setRetryCount((count) => count + 1);
  };

  if (!key) return { loading: false, chargers: [] as EvCharger[], errorMessage: '', retry };
  if (state.key !== key) return { loading: true, chargers: [] as EvCharger[], errorMessage: '', retry };
  return { ...state, retry };
}
