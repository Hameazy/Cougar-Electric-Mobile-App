import assert from 'node:assert/strict';
import test from 'node:test';
import { readCoordinatePair } from './coordinateValidation.ts';

test('accepts coordinate boundaries and ordinary values', () => {
  assert.deepEqual(readCoordinatePair(-90, -180), { latitude: -90, longitude: -180 });
  assert.deepEqual(readCoordinatePair(90, 180), { latitude: 90, longitude: 180 });
  assert.deepEqual(readCoordinatePair(38.5645, -121.4232), {
    latitude: 38.5645,
    longitude: -121.4232,
  });
});

test('rejects incomplete, non-numeric, non-finite, and out-of-range pairs', () => {
  assert.equal(readCoordinatePair(38, undefined), undefined);
  assert.equal(readCoordinatePair(undefined, -121), undefined);
  assert.equal(readCoordinatePair('38', -121), undefined);
  assert.equal(readCoordinatePair(38, '-121'), undefined);
  assert.equal(readCoordinatePair(Number.NaN, -121), undefined);
  assert.equal(readCoordinatePair(38, Number.POSITIVE_INFINITY), undefined);
  assert.equal(readCoordinatePair(-90.0001, -121), undefined);
  assert.equal(readCoordinatePair(90.0001, -121), undefined);
  assert.equal(readCoordinatePair(38, -180.0001), undefined);
  assert.equal(readCoordinatePair(38, 180.0001), undefined);
});
