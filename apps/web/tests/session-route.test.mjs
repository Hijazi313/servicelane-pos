import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeForAccess } from '../src/app/session-route.ts';

test('route admission respects session state and administrator role', () => {
  assert.equal(routeForAccess('login', 'administrator'), '/login');
  assert.equal(routeForAccess('restricted', 'administrator'), '/change-password');
  assert.equal(routeForAccess('home', 'administrator', 'staff'), '/');
  assert.equal(routeForAccess('home', 'administrator', 'administrator'), undefined);
  assert.equal(routeForAccess('home', 'staff', 'staff'), undefined);
  assert.equal(routeForAccess('home', 'login', 'administrator'), '/');
  assert.equal(routeForAccess('unknown', 'administrator'), undefined);
  assert.equal(routeForAccess('unavailable', 'staff'), undefined);
});
