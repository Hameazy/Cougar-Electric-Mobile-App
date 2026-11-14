import assert from 'node:assert/strict';
import { test } from 'node:test';
import { distanceInMiles, rankTechnicians } from '../src/technicians/distance.ts';

test('calculates zero distance for the same coordinates', () => {
  assert.equal(distanceInMiles({ latitude: 38.5816, longitude: -121.4944 }, { latitude: 38.5816, longitude: -121.4944 }), 0);
});

test('ranks technicians from nearest to farthest', () => {
  const ranked = rankTechnicians(
    { latitude: 38.5816, longitude: -121.4944 },
    [
      { id: 'far', name: 'Far', latitude: 39.0, longitude: -121.0, availability: 'available' },
      { id: 'near', name: 'Near', latitude: 38.582, longitude: -121.495, availability: 'available' },
    ],
  );

  assert.deepEqual(ranked.map((technician) => technician.id), ['near', 'far']);
});
