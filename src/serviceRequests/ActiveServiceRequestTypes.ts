// Firestore contract shared with the technician-matching work. Matching owns
// these fields on serviceRequests/{requestId}:
// assignedTechnician: { id, name, rating, vehicle: { year, make, model, color,
// licensePlate } }, estimatedArrivalAt: Timestamp, status, and updatedAt.
// Fields inside assignedTechnician are optional here so partial backend data can
// be displayed safely while an assignment update is still in progress.
export const ACTIVE_SERVICE_REQUEST_STATUSES = [
  'pending',
  'matched',
  'en-route',
  'arrived',
  'in-progress',
] as const;

export const CANCELLABLE_SERVICE_REQUEST_STATUSES = [
  'pending',
  'matched',
  'en-route',
] as const;

export type ActiveServiceRequestStatus =
  (typeof ACTIVE_SERVICE_REQUEST_STATUSES)[number];

export type AssignedTechnician = {
  id?: string;
  name?: string;
  rating?: number;
  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    color?: string;
    licensePlate?: string;
  };
};

export type ActiveServiceRequest = {
  id: string;
  customerId: string;
  status: ActiveServiceRequestStatus;
  issueType?: string;
  description?: string;
  timing?: 'asap' | 'scheduled';
  schedulePreference?: {
    day?: string;
    time?: string;
  };
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  assignedTechnician?: AssignedTechnician;
  estimatedArrivalAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export function isActiveServiceRequestStatus(
  status: string,
): status is ActiveServiceRequestStatus {
  return (ACTIVE_SERVICE_REQUEST_STATUSES as readonly string[]).includes(status);
}

export function isCancellationEligibleStatus(status: string): boolean {
  return (CANCELLABLE_SERVICE_REQUEST_STATUSES as readonly string[]).includes(
    status,
  );
}
