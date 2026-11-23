// Keep these values stable: the selection component passes them to its caller.
export const ELECTRICAL_ISSUES = [
  'Power outage',
  'Breaker keeps tripping',
  'Outlet not working',
  'Lighting issue',
  'EV charger issue',
  'Electrical panel issue',
  'Emergency electrical',
  'Other',
] as const;

export type ElectricalIssue = (typeof ELECTRICAL_ISSUES)[number];

export const ELECTRICAL_ISSUE_DESCRIPTIONS: Record<ElectricalIssue, string> = {
  'Power outage': 'Power is out in part or all of the property.',
  'Breaker keeps tripping': 'A breaker repeatedly trips or will not reset.',
  'Outlet not working': 'An outlet has no power or works intermittently.',
  'Lighting issue': 'Lights flicker, dim unexpectedly, or do not turn on.',
  'EV charger issue': 'An EV charger needs installation, service, or repair.',
  'Electrical panel issue': 'The electrical panel needs inspection, repair, or an upgrade.',
  'Emergency electrical': 'Sparks, smoke, burning smells, or another urgent hazard.',
  Other: 'The problem is not listed, or you are unsure which option fits.',
};
