import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describePhotonPoint, parsePhotonPlaces } from '../src/map/placeParsing.ts';

// Shaped like the GeoJSON that Photon returns: coordinates are [longitude, latitude]
const sample = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-121.7405, 38.5449] },
      properties: { osm_id: 11, osm_type: 'N', osm_key: 'place', name: 'Davis', city: 'Davis', state: 'California', country: 'United States' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-121.7458, 38.5382] },
      properties: { osm_id: 22, osm_type: 'W', osm_key: 'building', housenumber: '1400', street: 'Pine St', city: 'Davis', state: 'California', postcode: '95616' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-121.74, 38.54] },
      properties: { osm_id: 33, osm_type: 'N', osm_key: 'shop', name: 'Hardware Hank', housenumber: '5', street: 'Main St', city: 'Davis', state: 'California' },
    },
  ],
};

test('reads latitude and longitude in the right order', () => {
  const [davis] = parsePhotonPlaces(sample);
  assert.equal(davis!.latitude, 38.5449);
  assert.equal(davis!.longitude, -121.7405);
});

test('addresses use the street line, shops keep their own name', () => {
  const places = parsePhotonPlaces(sample);
  assert.equal(places[1]!.title, '1400 Pine St');
  assert.equal(places[1]!.subtitle, 'Davis, California 95616');
  assert.equal(places[2]!.title, 'Hardware Hank');
  assert.equal(places[2]!.subtitle, '5 Main St, Davis, California');
});

test('a town shows its state on the second line', () => {
  const [davis] = parsePhotonPlaces(sample);
  assert.equal(davis!.title, 'Davis');
  assert.equal(davis!.subtitle, 'California');
});

test('bad or empty answers give an empty list instead of crashing', () => {
  assert.deepEqual(parsePhotonPlaces(null), []);
  assert.deepEqual(parsePhotonPlaces({}), []);
  assert.deepEqual(parsePhotonPlaces({ features: [{ geometry: { coordinates: ['x', 2] }, properties: { name: 'Bad' } }] }), []);
  assert.deepEqual(parsePhotonPlaces({ features: [{ geometry: { coordinates: [500, 95] }, properties: { name: 'Off the map' } }] }), []);
  assert.deepEqual(parsePhotonPlaces({ features: [{ geometry: { coordinates: [1, 2] }, properties: {} }] }), []);
});

test('the same place twice only shows once', () => {
  const twice = { features: [sample.features[1], sample.features[1]] };
  assert.equal(parsePhotonPlaces(twice).length, 1);
});

test('address chip text for a GPS point', () => {
  assert.equal(describePhotonPoint({ features: [sample.features[1]] }), '1400 Pine St, Davis');
  assert.equal(describePhotonPoint({ features: [] }), '');
});
