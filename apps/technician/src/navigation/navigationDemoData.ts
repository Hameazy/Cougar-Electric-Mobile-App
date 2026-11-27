import type { MapPoint } from '../../../customer/src/parts/map/ServiceMapTypes';
import type { AssignedServiceRequest } from '../serviceRequests/AssignedServiceRequestTypes';

// Local CE-44 preview data only. It is never written to Firebase and is only
// selected by TechnicianNavigation when __DEV__ and ?demo=1 are both true.
export const DEMO_ASSIGNED_REQUEST: AssignedServiceRequest = {
  id: 'demo-request-not-in-firebase',
  customerId: 'demo-customer-not-in-firebase',
  assignedTechnicianId: 'demo-technician-not-in-firebase',
  status: 'matched',
  address: '6000 J Street',
  city: 'Sacramento',
  state: 'CA',
  zip: '95819',
  latitude: 38.5645,
  longitude: -121.4232,
};

export const DEMO_TECHNICIAN_POSITION: MapPoint = {
  latitude: 38.5788,
  longitude: -121.4935,
};
