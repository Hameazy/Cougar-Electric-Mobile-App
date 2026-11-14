const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceInMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude)
      * Math.cos(toLatitude)
      * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function rankTechnicians(
  customerLocation: { latitude: number; longitude: number },
  technicians: import('./AvailableTechnicianTypes').AvailableTechnician[],
): import('./AvailableTechnicianTypes').RankedTechnician[] {
  return technicians
    .map((technician) => ({
      ...technician,
      distanceMiles: distanceInMiles(customerLocation, technician),
    }))
    .sort((left, right) => left.distanceMiles - right.distanceMiles);
}
