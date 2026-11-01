// Keep these values stable: the selection component passes them to its caller.
export const ELECTRICAL_ISSUES = [
  'Power outage',
  'Outlet not working',
  'Circuit breaker issue',
  'Electrical wiring problem',
  'Flickering lights',
  'Other electrical issue',
] as const;

export type ElectricalIssue = (typeof ELECTRICAL_ISSUES)[number];

export const ELECTRICAL_ISSUE_DESCRIPTIONS: Record<ElectricalIssue, string> = {
  'Power outage': 'Power is out in part or all of the property.',
  'Outlet not working': 'An outlet has no power or works intermittently.',
  'Circuit breaker issue': 'A breaker keeps tripping or will not reset.',
  'Electrical wiring problem': 'Wiring appears damaged or a connection seems loose.',
  'Flickering lights': 'Lights flicker, dim unexpectedly, or keep going out.',
  'Other electrical issue': 'The problem is not listed, or you are unsure which option fits.',
};
