export const NAVIGABLE_SERVICE_REQUEST_STATUSES = [
  'matched',
  'en-route',
] as const;

export type NavigableServiceRequestStatus =
  (typeof NAVIGABLE_SERVICE_REQUEST_STATUSES)[number];

export type AssignedServiceRequest = {
  id: string;
  customerId: string;
  assignedTechnicianId: string;
  status: NavigableServiceRequestStatus;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  updatedAt?: Date;
};

export function isNavigableServiceRequestStatus(
  status: unknown,
): status is NavigableServiceRequestStatus {
  return (
    typeof status === 'string'
    && (NAVIGABLE_SERVICE_REQUEST_STATUSES as readonly string[]).includes(status)
  );
}

export function formatServiceAddress(
  request: Pick<AssignedServiceRequest, 'address' | 'city' | 'state' | 'zip'>,
): string {
  return `${request.address}\n${request.city}, ${request.state} ${request.zip}`;
}
