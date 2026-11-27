export type CoordinatePair = {
  latitude: number;
  longitude: number;
};

export function readCoordinatePair(
  latitude: unknown,
  longitude: unknown,
): CoordinatePair | undefined {
  if (
    typeof latitude !== 'number'
    || !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || typeof longitude !== 'number'
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  ) {
    return undefined;
  }

  return { latitude, longitude };
}
