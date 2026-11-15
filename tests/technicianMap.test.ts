import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePlaceMatches } from '../src/technicians/placeParsing.ts';
import { parseDriveTimes, parseRoute } from '../src/technicians/routing.ts';
import {
  driveInfoFor,
  estimateDriveMinutes,
  formatDriveTime,
  formatMiles,
  formatShortMinutes,
} from '../src/technicians/travelEstimate.ts';
import {
  filterTechnicians,
  initialsOf,
  isEvSpecialist,
  railLengthMiles,
  toggleFilter,
  type MapTechnician,
} from '../src/technicians/technicianFilters.ts';

const technicians: MapTechnician[] = [
  { id: 'a', name: 'Marcus Reed', rating: 4.9, latitude: 0, longitude: 0, availability: 'available', distanceMiles: 1.2, evCertified: true },
  { id: 'b', name: 'Dana Lopez', rating: 4.2, latitude: 0, longitude: 0, availability: 'busy', distanceMiles: 4.8, specialties: ['EV charger install'] },
  { id: 'c', name: 'Sam', latitude: 0, longitude: 0, availability: 'available', distanceMiles: 12.3, specialties: ['Lighting'] },
];

const ids = (list: MapTechnician[]) => list.map((technician) => technician.id);

test('drive estimate grows with distance and never shows 0 min', () => {
  assert.equal(estimateDriveMinutes(0), 2);
  assert.equal(estimateDriveMinutes(5), 15);
  assert.ok(estimateDriveMinutes(20) > estimateDriveMinutes(5));
  assert.equal(estimateDriveMinutes(Number.NaN), 0);
});

test('drive time text switches to hours after 60 minutes', () => {
  assert.equal(formatDriveTime(8), 'about 8 min');
  assert.equal(formatDriveTime(60), 'about 1 hr');
  assert.equal(formatDriveTime(75), 'about 1 hr 15 min');
  assert.equal(formatShortMinutes(8), '8 min');
  assert.equal(formatShortMinutes(75), '1 hr 15 min');
  assert.equal(formatMiles(0.05), 'under 0.1 mi');
  assert.equal(formatMiles(3.456), '3.5 mi');
});

test('drive info uses the road time when we have it and says when it is a guess', () => {
  const road = driveInfoFor(5, { minutes: 11, roadMiles: 6.4 });
  assert.deepEqual(road, { minutes: 11, roadMiles: 6.4, source: 'road' });

  const guess = driveInfoFor(5);
  assert.equal(guess.source, 'estimate');
  assert.equal(guess.minutes, estimateDriveMinutes(5));
  assert.equal(guess.roadMiles, undefined);
});

test('no filters keeps everyone, nearest first', () => {
  assert.deepEqual(ids(filterTechnicians(technicians, [])), ['a', 'b', 'c']);
});

test('each filter keeps the right people', () => {
  assert.deepEqual(ids(filterTechnicians(technicians, ['available'])), ['a', 'c']);
  assert.deepEqual(ids(filterTechnicians(technicians, ['close'])), ['a', 'b']);
  assert.deepEqual(ids(filterTechnicians(technicians, ['ev'])), ['a', 'b']);
});

test('filters combine: a technician must match all of them', () => {
  assert.deepEqual(ids(filterTechnicians(technicians, ['close', 'available'])), ['a']);
  assert.deepEqual(ids(filterTechnicians(technicians, ['ev', 'available', 'close'])), ['a']);
  assert.deepEqual(ids(filterTechnicians(technicians, ['ev', 'available'])), ['a']);
});

test('toggling a filter adds it, toggling again removes it', () => {
  assert.deepEqual(toggleFilter([], 'ev'), ['ev']);
  assert.deepEqual(toggleFilter(['ev', 'close'], 'ev'), ['close']);
});

test('EV specialists are found by the certified flag or by their specialties', () => {
  assert.equal(isEvSpecialist({ evCertified: true }), true);
  assert.equal(isEvSpecialist({ specialties: ['EV charger install'] }), true);
  assert.equal(isEvSpecialist({ specialties: ['Electric vehicle wiring'] }), true);
  assert.equal(isEvSpecialist({ specialties: ['Level 2 charger setup'] }), true);
  assert.equal(isEvSpecialist({ specialties: ['Lighting', 'Review'] }), false);
  assert.equal(isEvSpecialist({}), false);
});

test('distance rail is at least 10 mi and rounds up past the farthest dot', () => {
  assert.equal(railLengthMiles([]), 10);
  assert.equal(railLengthMiles([1.2, 4.8]), 10);
  assert.equal(railLengthMiles([12.3]), 15);
  assert.equal(railLengthMiles([14.8]), 20);
});

test('initials come from the first and last name', () => {
  assert.equal(initialsOf('Marcus Reed'), 'MR');
  assert.equal(initialsOf('  sam  '), 'S');
  assert.equal(initialsOf('Ana Maria Cruz'), 'AC');
  assert.equal(initialsOf(''), '?');
});

// ---------- routing answers (shaped like real OSRM replies) ----------

test('reads a road route: miles, minutes and the path to draw', () => {
  const route = parseRoute({
    code: 'Ok',
    routes: [{
      distance: 8046.7,
      duration: 725,
      geometry: { type: 'LineString', coordinates: [[-121.49, 38.58], [-121.47, 38.57], [-121.44, 38.55]] },
    }],
  });

  assert.ok(route);
  assert.equal(Math.round(route.roadMiles * 10) / 10, 5);
  assert.equal(route.minutes, 12);
  assert.equal(route.path.length, 3);
  // OSRM sends [longitude, latitude]
  assert.deepEqual(route.path[0], { latitude: 38.58, longitude: -121.49 });
});

test('a failed or empty routing answer gives no route', () => {
  assert.equal(parseRoute({ code: 'NoRoute', routes: [] }), null);
  assert.equal(parseRoute({ code: 'Ok', routes: [] }), null);
  assert.equal(parseRoute({ code: 'Ok', routes: [{ distance: 1, duration: 1, geometry: { coordinates: [[1, 2]] } }] }), null);
  assert.equal(parseRoute(null), null);
  assert.equal(parseRoute('nope'), null);
});

test('reads drive times for a whole list, with null for unroutable ones', () => {
  const times = parseDriveTimes({
    code: 'Ok',
    durations: [[300], [null], [1500]],
    distances: [[3218.68], [null], [16093.4]],
  }, 3);

  assert.equal(times.length, 3);
  assert.equal(times[0]?.minutes, 5);
  assert.equal(Math.round((times[0]?.roadMiles ?? 0) * 10) / 10, 2);
  assert.equal(times[1], null);
  assert.equal(times[2]?.minutes, 25);
});

test('a bad drive time answer gives nulls instead of crashing', () => {
  assert.deepEqual(parseDriveTimes({ code: 'InvalidQuery' }, 2), [null, null]);
  assert.deepEqual(parseDriveTimes(undefined, 1), [null]);
});

// ---------- address search answers (shaped like real Nominatim replies) ----------

test('reads address matches into short labels with real numbers', () => {
  const matches = parsePlaceMatches([
    {
      lat: '38.5816',
      lon: '-121.4944',
      display_name: '1315, 10th Street, Capitol Mall, Sacramento, Sacramento County, California, 95814, United States',
      address: { house_number: '1315', road: '10th Street', city: 'Sacramento' },
    },
    { lat: 'oops', lon: '-121', display_name: 'broken' },
    { lat: '38.55', lon: '-121.42', display_name: 'Sacramento State, Sacramento, California', name: 'Sacramento State', address: { city: 'Sacramento' } },
  ]);

  assert.equal(matches.length, 2);
  assert.equal(matches[0].label, '1315 10th Street, Sacramento');
  assert.equal(matches[0].latitude, 38.5816);
  assert.equal(matches[0].longitude, -121.4944);
  assert.equal(matches[1].label, 'Sacramento State, Sacramento');
});

test('a city search does not repeat the city name in the label', () => {
  const [match] = parsePlaceMatches([
    { lat: '38.58', lon: '-121.49', display_name: 'Sacramento, Sacramento County, California, United States', name: 'Sacramento', address: { city: 'Sacramento' } },
  ]);
  assert.equal(match.label, 'Sacramento');
});

test('anything that is not a list of matches gives no matches', () => {
  assert.deepEqual(parsePlaceMatches({ error: 'nope' }), []);
  assert.deepEqual(parsePlaceMatches(null), []);
  assert.deepEqual(parsePlaceMatches([]), []);
});
