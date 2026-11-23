// Straight-line distance shown to customers, e.g. "3.5 mi".
// (distanceMiles comes from the haversine formula in distance.ts. It is not a
// driving distance, and we do not show drive times because no routing service
// is connected.)
export function formatMiles(distanceMiles: number): string {
  if (distanceMiles < 0.1) return 'under 0.1 mi';
  return `${distanceMiles.toFixed(1)} mi`;
}
