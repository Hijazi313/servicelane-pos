// Offline manifest and admission checks only. No database, configuration or migration runner imports.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const migrations = new URL('../migrations/', import.meta.url);
export const cases = Object.freeze(['C01', 'C02', 'C03', 'C04', 'C05', 'C06']);
export async function expectedBaseline(stage) {
  if (stage !== 'pre-0007' && stage !== 'post-0007') throw new Error('Unknown stage');
  const journal = JSON.parse(await readFile(new URL('meta/_journal.json', migrations), 'utf8'));
  if (journal.entries.length !== 8 || journal.entries[6].tag !== '0006_billing_cash'
    || journal.entries[7].tag !== '0007_dark_dagger') throw new Error('Migration plan changed');
  const count = stage === 'pre-0007' ? 7 : 8;
  const history = await Promise.all(journal.entries.slice(0, count).map(async entry => ({
    createdAt: entry.when,
    hash: createHash('sha256').update(await readFile(new URL(`${entry.tag}.sql`, migrations))).digest('hex'),
  })));
  const snapshot = JSON.parse(await readFile(new URL(`meta/000${count - 1}_snapshot.json`, migrations), 'utf8'));
  return { stage, history, tables: Object.keys(snapshot.tables).map(name => name.replace(/^public\./, '')).sort(),
    snapshotHash: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex') };
}
export function admitObservation(expected, observed, approvedFingerprint) {
  if (!/^[a-f0-9]{64}$/.test(approvedFingerprint ?? '') || observed.fingerprint !== approvedFingerprint) throw new Error('Target mismatch');
  if (observed.stage !== expected.stage || observed.readOnly !== true || observed.distinctBackends !== true) throw new Error('Baseline mode mismatch');
  if (JSON.stringify(observed.history) !== JSON.stringify(expected.history)) throw new Error('History mismatch');
  if (!observed.counts || JSON.stringify(Object.keys(observed.counts).sort()) !== JSON.stringify(expected.tables)) throw new Error('Table mismatch');
  if (Object.values(observed.counts).some(count => count !== 0)) throw new Error('Unexpected data');
  if (observed.catalogVerified !== true) throw new Error('Catalog proof missing');
  return true;
}
