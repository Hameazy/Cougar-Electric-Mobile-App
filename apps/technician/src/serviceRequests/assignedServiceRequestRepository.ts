import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { app } from '../../../../packages/backend/firebaseApp';
import {
  isNavigableServiceRequestStatus,
  type AssignedServiceRequest,
} from './AssignedServiceRequestTypes';
import { readCoordinatePair } from './coordinateValidation';

const SERVICE_REQUESTS_COLLECTION = 'serviceRequests';
const db = getFirestore(app);

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readDate(value: unknown): Date | undefined {
  if (!isRecord(value) || typeof value.toDate !== 'function') return undefined;
  const date = value.toDate();
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined;
}

function readAssignedRequest(
  snapshot: DocumentSnapshot<DocumentData>,
  technicianId: string,
): AssignedServiceRequest | null {
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  const assignedTechnician = isRecord(data.assignedTechnician)
    ? data.assignedTechnician
    : null;
  const assignedTechnicianId = readRequiredText(assignedTechnician?.id);
  const customerId = readRequiredText(data.customerId);
  const address = readRequiredText(data.address);
  const city = readRequiredText(data.city);
  const state = readRequiredText(data.state);
  const zip = readRequiredText(data.zip);
  const coordinates = readCoordinatePair(data.latitude, data.longitude);

  // This duplicates the Firestore rule intentionally. A document is never
  // returned to the UI unless its embedded assignment belongs to this user.
  if (
    assignedTechnicianId !== technicianId
    || !customerId
    || !isNavigableServiceRequestStatus(data.status)
    || !address
    || !city
    || !state
    || !zip
  ) {
    return null;
  }

  return {
    id: snapshot.id,
    customerId,
    assignedTechnicianId,
    status: data.status,
    address,
    city,
    state: state.toUpperCase(),
    zip,
    ...coordinates,
    updatedAt: readDate(data.updatedAt),
  };
}

function readErrorMessage(error: unknown): string {
  const code = isRecord(error) && typeof error.code === 'string'
    ? error.code
    : undefined;

  if (code === 'permission-denied') {
    return 'This job is unavailable or is not assigned to your technician account.';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Unable to load your assigned job. Check your connection and try again.';
  }
  return 'We could not load your assigned job.';
}

function updatedTime(request: AssignedServiceRequest): number {
  return request.updatedAt?.getTime() ?? 0;
}

export function subscribeToNavigableAssignments(
  technicianId: string,
  requestId: string | undefined,
  onRequests: (requests: AssignedServiceRequest[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  if (requestId) {
    if (requestId.includes('/')) {
      onError('This service request link is invalid.');
      return () => {};
    }
    return onSnapshot(
      doc(db, SERVICE_REQUESTS_COLLECTION, requestId),
      (snapshot) => {
        const request = readAssignedRequest(snapshot, technicianId);
        onRequests(request ? [request] : []);
      },
      (error) => onError(readErrorMessage(error)),
    );
  }

  // CE-42 and CE-43 must preserve assignedTechnician.id as the canonical
  // assignment field. The matching where-clause is also required by rules.
  const assignmentsQuery = query(
    collection(db, SERVICE_REQUESTS_COLLECTION),
    where('assignedTechnician.id', '==', technicianId),
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      const requests = snapshot.docs
        .map((item: QueryDocumentSnapshot<DocumentData>) =>
          readAssignedRequest(item, technicianId),
        )
        .filter(
          (request): request is AssignedServiceRequest => request !== null,
        )
        .sort((left, right) => updatedTime(right) - updatedTime(left));
      onRequests(requests);
    },
    (error) => onError(readErrorMessage(error)),
  );
}
