import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime } from './cs02-runtime.mjs';

test('test runtime composes real cashier and Billing providers without opening a connection', async () => {
  let attempted = false;
  const pool = { connect() { attempted = true; throw new Error('Unexpected connection'); },
    query() { attempted = true; throw new Error('Unexpected query'); } };
  const runtime = await createRuntime(pool);
  assert.equal(attempted, false);
  assert.equal(typeof runtime.drawers.open, 'function');
  assert.equal(typeof runtime.cashier.attribute, 'function');
  assert.equal(typeof runtime.billing.settle, 'function');
  assert.equal(runtime.billing.cashier, runtime.cashier);
  assert.equal(runtime.cashier.store, runtime.drawerStore);
});
