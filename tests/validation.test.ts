
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateServiceRequest,
  type ServiceRequestInput,
} from '../src/serviceRequests/validation.ts';

const validRequest: ServiceRequestInput = {
  issueType: 'Power outage',
  description: 'The kitchen outlets stopped working.',
  address: '123 Main Street',
  city: 'Sacramento',
  state: 'CA',
  zip: '95814',
  attachments: [],
};

test('accepts a complete service request', () => {
  assert.deepEqual(validateServiceRequest(validRequest), {});
});

test('rejects a missing electrical issue', () => {
  const errors = validateServiceRequest({
    ...validRequest,
    issueType: '',
  });

  assert.equal(errors.issueType, 'Please select an electrical issue.');
});

test('rejects a missing description', () => {
  const errors = validateServiceRequest({
    ...validRequest,
    description: '   ',
  });

  assert.equal(errors.description, 'Please describe the electrical problem.');
});

test('rejects a missing address', () => {
  const errors = validateServiceRequest({
    ...validRequest,
    address: '',
  });

  assert.equal(errors.address, 'Please enter your service address.');
});

test('rejects an invalid state and ZIP code', () => {
  const errors = validateServiceRequest({
    ...validRequest,
    state: 'California',
    zip: '123',
  });

  assert.equal(
    errors.state,
    'Please enter a valid two-letter state code.',
  );
  assert.equal(errors.zip, 'Please enter a valid ZIP code.');
});

test('rejects invalid attachments', () => {
  const errors = validateServiceRequest({
    ...validRequest,
    attachments: [''],
  });

  assert.equal(errors.attachments, 'Please check your attachments.');
});
