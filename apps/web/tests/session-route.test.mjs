import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathForScreen } from '../src/app/session-route.ts';

test('only confirmed access states select routes', () => {
  assert.equal(pathForScreen('login'), '/login');
  assert.equal(pathForScreen('restricted'), '/change-password');
  assert.equal(pathForScreen('home'), '/');
  for (const state of ['checking', 'unavailable', 'unknown']) assert.equal(pathForScreen(state), undefined);
});
