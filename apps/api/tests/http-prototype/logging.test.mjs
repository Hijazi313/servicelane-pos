import test from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '@nestjs/common';
import { errorPolicy, reportHttpCompletion } from '../../dist/orders-check/infrastructure/http/http-error-policy.js';

test('production diagnostic policy records safe context without raw exception data', () => {
  const events = [];
  Logger.overrideLogger({ log: value => events.push(value), error: value => events.push(value), warn() {}, debug() {}, verbose() {}, fatal() {} });
  try {
    errorPolicy(() => undefined).reportUnexpected(new TypeError('SyntheticSecret customer token SQL'), 'request-1');
    reportHttpCompletion({ requestId: 'request-1', method: 'POST', route: '/api/v1/orders', status: 500, duration: 3, code: 'INTERNAL_ERROR' });
    assert.equal(events.length, 2);
    assert.equal(events[0].kind, 'TypeError'); assert.equal(events[0].requestId, 'request-1');
    assert.equal(events[1].code, 'INTERNAL_ERROR');
    assert.doesNotMatch(JSON.stringify(events), /SyntheticSecret|customer|token|SQL/);
  } finally { Logger.overrideLogger(false); }
});
