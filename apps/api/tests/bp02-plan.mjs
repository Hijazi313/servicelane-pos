// Offline preparation only: no configuration, driver, pool, migrator or application imports.
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';

const migrations = new URL('../migrations/', import.meta.url);
export const cases = Object.freeze(['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07']);
export async function expectedBaseline(stage) {
  if (!['pre-0006', 'post-0006'].includes(stage)) throw new Error('Unknown baseline stage');
  const journal = JSON.parse(await readFile(new URL('meta/_journal.json', migrations), 'utf8'));
  if (journal.entries.length !== 7 || journal.entries.at(-1).tag !== '0006_billing_cash') throw new Error('Migration plan changed');
  const count = stage === 'pre-0006' ? 6 : 7;
  const history = await Promise.all(journal.entries.slice(0, count).map(async entry => ({
    createdAt: entry.when,
    hash: createHash('sha256').update(await readFile(new URL(`${entry.tag}.sql`, migrations))).digest('hex'),
  })));
  const snapshot = JSON.parse(await readFile(new URL(`meta/000${count - 1}_snapshot.json`, migrations), 'utf8'));
  return { stage, history, tables: Object.keys(snapshot.tables).map(name => name.replace(/^public\./, '')).sort(),
    snapshotHash: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex') };
}
// Input is a sanitized observation supplied by a future separately reviewed collector.
// This checks history/count/identity admission, NOT catalog equivalence or permission.
export function admitObservation(expected, observed, approvedFingerprint) {
  if (!/^[a-f0-9]{64}$/.test(approvedFingerprint ?? '') || observed.fingerprint !== approvedFingerprint) throw new Error('Target mismatch');
  if (observed.stage !== expected.stage || observed.readOnly !== true || observed.distinctBackends !== true) throw new Error('Baseline mode mismatch');
  if (JSON.stringify(observed.history) !== JSON.stringify(expected.history)) throw new Error('History mismatch');
  if (JSON.stringify(Object.keys(observed.counts).sort()) !== JSON.stringify(expected.tables)) throw new Error('Table mismatch');
  if (Object.values(observed.counts).some(count => count !== 0)) throw new Error('Unexpected data');
  if (observed.catalogVerified !== true) throw new Error('Catalog proof missing');
  return true;
}
export function syntheticFixtures() {
  const id = () => randomUUID();
  return { runId: id(), businesses: [id(), id()], branches: [id(), id(), id()], actors: [id(), id()],
    orders: Array.from({ length: 12 }, id), retryKeys: Array.from({ length: 12 }, id),
    chargeId: id(), taxId: id(),
    display: { businessName: 'BP02 synthetic business', branchName: 'BP02 synthetic branch', branchAddress: null },
    policy: { status: 'configured', currencyCode: 'PKR', scale: 2, rounding: 'halfUp', configurationNote: 'Synthetic development only' },
    merchandiseMinor: '10000', optionalChargeMinor: '500', taxBasisPoints: 1000,
    oracle: { unselectedPayableMinor: '11000', selectedPayableMinor: '11550' } };
}
export function cleanupAdmission(ledger, observed) {
  if (!ledger?.runId || ledger.target !== observed.target || ledger.baselineHash !== observed.baselineHash) throw new Error('Cleanup target mismatch');
  if (!Array.isArray(ledger.rows) || !Array.isArray(observed.rows)) throw new Error('Ownership proof missing');
  const identity = row => JSON.stringify([row.table, row.key, row.digest]);
  if (ledger.rows.some(row => !row.table || !row.key || !/^[a-f0-9]{64}$/.test(row.digest))) throw new Error('Invalid ledger row');
  const owned = new Set(ledger.rows.map(identity));
  if (owned.size !== ledger.rows.length || observed.rows.length !== ledger.rows.length || new Set(observed.rows.map(identity)).size !== observed.rows.length || observed.rows.some(row => !owned.has(identity(row)))) throw new Error('Ownership mismatch');
  return true;
}
