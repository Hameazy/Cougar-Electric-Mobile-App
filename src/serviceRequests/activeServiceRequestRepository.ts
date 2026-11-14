import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Transaction,
  type Unsubscribe,
} from 'firebase/firestore';
import { app } from '../../firebaseApp';
import { auth } from '../../firebaseConfig';
import { SERVICE_REQUESTS_COLLECTION } from './ServiceRequestConstants';
import {
  ACTIVE_SERVICE_REQUEST_STATUSES,
  isActiveServiceRequestStatus,
  isCancellationEligibleStatus,
  type ActiveServiceRequest,
  type AssignedTechnician,
} from './ActiveServiceRequestTypes';

const db = getFirestore(app);

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readFirebaseErrorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === 'string'
    ? error.code
    : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readDate(value: unknown): Date | undefined {
  if (!isRecord(value) || typeof value.toDate !== 'function') return undefined;

  const date = value.toDate();
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined;
}

function readTiming(value: unknown): 'asap' | 'scheduled' | undefined {
  return value === 'asap' || value === 'scheduled' ? value : undefined;
}

function readSchedulePreference(value: unknown): ActiveServiceRequest['schedulePreference'] {
  if (!isRecord(value)) return undefined;

  return {
    day: readString(value.day),
    time: readString(value.time),
  };
}

function readAssignedTechnician(value: unknown): AssignedTechnician | undefined {
  if (!isRecord(value)) return undefined;

  const rawVehicle = isRecord(value.vehicle) ? value.vehicle : undefined;
  const vehicle = rawVehicle
    ? {
        year: readNumber(rawVehicle.year),
        make: readString(rawVehicle.make),
        model: readString(rawVehicle.model),
        color: readString(rawVehicle.color),
        licensePlate: readString(rawVehicle.licensePlate),
      }
    : undefined;

  return {
    id: readString(value.id),
    name: readString(value.name),
    rating: readNumber(value.rating),
    vehicle,
  };
}

function toActiveServiceRequest(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): ActiveServiceRequest | null {
  const data = snapshot.data();
  const customerId = readString(data.customerId);
  const status = readString(data.status);

  if (!customerId || !status || !isActiveServiceRequestStatus(status)) {
    return null;
  }

  return {
    id: snapshot.id,
    customerId,
    status,
    issueType: readString(data.issueType),
    description: readString(data.description),
    timing: readTiming(data.timing),
    schedulePreference: readSchedulePreference(data.schedulePreference),
    address: readString(data.address),
    city: readString(data.city),
    state: readString(data.state),
    zip: readString(data.zip),
    latitude: readNumber(data.latitude),
    longitude: readNumber(data.longitude),
    assignedTechnician: readAssignedTechnician(data.assignedTechnician),
    estimatedArrivalAt: readDate(data.estimatedArrivalAt),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

function requestTime(request: ActiveServiceRequest): number {
  return request.updatedAt?.getTime() ?? request.createdAt?.getTime() ?? 0;
}

function getFirebaseReadErrorMessage(error: unknown): string {
  const code = readFirebaseErrorCode(error);
  if (code === 'permission-denied') {
    return 'Your active service requests are not available. Please sign in again.';
  }

  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Unable to load active requests. Check your connection and try again.';
  }

  return 'We could not load your active service requests.';
}

export function subscribeToActiveServiceRequests(
  customerId: string,
  onRequests: (requests: ActiveServiceRequest[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const activeRequestsQuery = query(
    collection(db, SERVICE_REQUESTS_COLLECTION),
    where('customerId', '==', customerId),
    where('status', 'in', [...ACTIVE_SERVICE_REQUEST_STATUSES]),
  );

  return onSnapshot(
    activeRequestsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const requests = snapshot.docs
        .map((document: QueryDocumentSnapshot<DocumentData>) =>
          toActiveServiceRequest(document),
        )
        .filter(
          (
            request: ActiveServiceRequest | null,
          ): request is ActiveServiceRequest => request !== null,
        )
        .sort(
          (left: ActiveServiceRequest, right: ActiveServiceRequest) =>
            requestTime(right) - requestTime(left),
        );

      onRequests(requests);
    },
    (error: Error) => onError(getFirebaseReadErrorMessage(error)),
  );
}

export async function cancelServiceRequest(
  requestId: string,
  expectedCustomerId: string,
): Promise<void> {
  const customer = auth.currentUser;

  if (!customer || customer.uid !== expectedCustomerId) {
    throw new Error('Please sign in again before cancelling this request.');
  }

  const requestRef = doc(db, SERVICE_REQUESTS_COLLECTION, requestId);

  try {
    await runTransaction(db, async (transaction: Transaction) => {
      const requestSnapshot = await transaction.get(requestRef);

      if (!requestSnapshot.exists()) {
        throw new Error('This service request no longer exists.');
      }

      const request = requestSnapshot.data();
      if (request.customerId !== customer.uid) {
        throw new Error('You can only cancel your own service requests.');
      }

      if (
        typeof request.status !== 'string' ||
        !isCancellationEligibleStatus(request.status)
      ) {
        throw new Error('This service request can no longer be cancelled.');
      }

      transaction.update(requestRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'customer',
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'This service request no longer exists.' ||
        error.message === 'You can only cancel your own service requests.' ||
        error.message === 'This service request can no longer be cancelled.')
    ) {
      throw error;
    }

    const code = readFirebaseErrorCode(error);
    if (code === 'permission-denied') {
      throw new Error(
        'Cancellation is not permitted. The request may have already changed.',
      );
    }

    if (code === 'unavailable' || code === 'deadline-exceeded') {
      throw new Error(
        'Unable to cancel right now. Check your connection and try again.',
      );
    }

    throw new Error('We could not cancel this request. Please try again.');
  }
}
