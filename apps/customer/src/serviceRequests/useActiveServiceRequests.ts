import { useEffect, useState } from 'react';
import type { ActiveServiceRequest } from './ActiveServiceRequestTypes';
import { subscribeToActiveServiceRequests } from './activeServiceRequestRepository';

type ActiveRequestsState = {
  customerId: string;
  requests: ActiveServiceRequest[];
  loading: boolean;
  errorMessage: string;
};

export function useActiveServiceRequests(customerId?: string) {
  const [state, setState] = useState<ActiveRequestsState | null>(null);

  useEffect(() => {
    if (!customerId) return;

    return subscribeToActiveServiceRequests(
      customerId,
      (activeRequests) => {
        setState({
          customerId,
          requests: activeRequests,
          loading: false,
          errorMessage: '',
        });
      },
      (message) => {
        setState({
          customerId,
          requests: [],
          loading: false,
          errorMessage: message,
        });
      },
    );
  }, [customerId]);

  if (!customerId) {
    return { requests: [], loading: false, errorMessage: '' };
  }

  if (!state || state.customerId !== customerId) {
    return { requests: [], loading: true, errorMessage: '' };
  }

  return state;
}
