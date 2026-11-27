import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { app } from '../../../../packages/backend/firebaseApp';
import type { AssignedServiceRequest } from './AssignedServiceRequestTypes';
import { subscribeToNavigableAssignments } from './assignedServiceRequestRepository';

type AssignmentState = {
  technicianId?: string;
  authenticated: boolean;
  loading: boolean;
  requests: AssignedServiceRequest[];
  errorMessage: string;
};

const INITIAL_STATE: AssignmentState = {
  authenticated: false,
  loading: true,
  requests: [],
  errorMessage: '',
};

export function useAssignedServiceRequests(requestId?: string, enabled = true) {
  const [state, setState] = useState<AssignmentState>(INITIAL_STATE);

  useEffect(() => {
    // Demo mode passes enabled=false, so it never observes auth or reads
    // serviceRequests while displaying local sample data.
    if (!enabled) return;

    let stopRequests: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(getAuth(app), (user) => {
      stopRequests?.();
      stopRequests = undefined;

      if (!user) {
        setState({
          authenticated: false,
          loading: false,
          requests: [],
          errorMessage: '',
        });
        return;
      }

      setState({
        technicianId: user.uid,
        authenticated: true,
        loading: true,
        requests: [],
        errorMessage: '',
      });

      stopRequests = subscribeToNavigableAssignments(
        user.uid,
        requestId,
        (requests) => setState({
          technicianId: user.uid,
          authenticated: true,
          loading: false,
          requests,
          errorMessage: '',
        }),
        (errorMessage) => setState({
          technicianId: user.uid,
          authenticated: true,
          loading: false,
          requests: [],
          errorMessage,
        }),
      );
    });

    return () => {
      stopAuth();
      stopRequests?.();
    };
  }, [enabled, requestId]);

  return state;
}
