// Shared child/offline HTTP checks; no configuration, driver or connection imports.
import assert from 'node:assert/strict';
export async function verifyRestartHttp(http, { proof, expected, orderId, foreignTicketId }, progress = () => {}) {
  assert.equal(expected.length, 5);
  for (const [index, ticket] of expected.entries()) {
    progress(`ticket-read-${index + 1}`);
    const read = await http.request(proof, 'GET', '/' + ticket.id); assert.equal(read.statusCode, 200); assert.deepEqual(read.json(), ticket);
  }
  progress('ready-redispatch');
  const retry = await http.request(proof, 'POST', '', { orderId }); assert.equal(retry.statusCode, 201); assert.deepEqual(retry.json(), expected[0]);
  progress('queue-readback');
  let cursor, ids = [];
  do {
    const page = await http.request(proof, 'GET', '?limit=2' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    assert.equal(page.statusCode, 200); const body = page.json(); ids.push(...body.tickets.map(row => row.id)); cursor = body.nextCursor;
    assert.ok(ids.length <= expected.length);
  } while (cursor);
  assert.deepEqual(ids, expected.map(ticket => ticket.id));
  progress('foreign-denial');
  assert.equal((await http.request(proof, 'GET', '/' + foreignTicketId)).statusCode, 404);
}
