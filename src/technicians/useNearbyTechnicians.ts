import { useEffect, useState } from 'react';
import { rankTechnicians } from './distance';
import type { RankedTechnician } from './AvailableTechnicianTypes';
import { subscribeToAvailableTechnicians } from './availableTechnicianRepository';

type NearbyTechniciansState = {
  locationKey?: string;
  loading: boolean;
  technicians: RankedTechnician[];
  errorMessage: string;
};

export function useNearbyTechnicians(location?: { latitude?: number; longitude?: number }) {
  const locationKey = location?.latitude !== undefined && location.longitude !== undefined
    ? `${location.latitude}:${location.longitude}`
    : undefined;
  const [state, setState] = useState<NearbyTechniciansState>({
    loading: false,
    technicians: [],
    errorMessage: '',
  });

  useEffect(() => {
    const latitude = location?.latitude;
    const longitude = location?.longitude;
    if (locationKey === undefined || latitude === undefined || longitude === undefined) {
      return;
    }

    return subscribeToAvailableTechnicians(
      (technicians) => setState({
        locationKey,
        loading: false,
        technicians: rankTechnicians({ latitude, longitude }, technicians),
        errorMessage: '',
      }),
      (errorMessage) => setState({ locationKey, loading: false, technicians: [], errorMessage }),
    );
  }, [location?.latitude, location?.longitude, locationKey]);

  if (location?.latitude === undefined || location.longitude === undefined) {
    return { loading: false, technicians: [], errorMessage: '' };
  }

  if (state.locationKey !== locationKey) {
    return { loading: true, technicians: [], errorMessage: '' };
  }

  return state;
}
