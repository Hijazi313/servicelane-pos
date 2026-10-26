import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { DisplayStore, type DisplayScope } from '../application/display-store.js';
import { DisplaySettingsError, type DisplayView } from '../application/display-settings.js';
import { validateBusinessConfiguration } from '../application/business-configuration.js';
import { businesses, branches, businessDisplayHistory } from './schema.js';
function knownUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ('code' in error && typeof error.code === 'string' &&
    (error.code.startsWith('08') || ['57P01', '57P02', '57P03', '53300', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code))) return true;
  return 'cause' in error && error.cause !== error ? knownUnavailable(error.cause) : false;
}
async function available<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); }
  catch (error) {
    if (knownUnavailable(error)) throw new DisplaySettingsError('DISPLAY_SETTINGS_UNAVAILABLE');
    throw error;
  }
}
@Injectable()
export class PostgresDisplayStore extends DisplayStore {
  constructor(private readonly database: DatabaseService) { super(); }
  async get(scope: DisplayScope, transaction?: TransactionContext): Promise<DisplayView> {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    const rows = await available(() => db.select({ revision: branches.displayRevision, businessName: businesses.name, branchName: branches.name,
      branchAddress: branches.address, currencyCode: businesses.currencyCode, timezone: businesses.timezone }).from(branches)
      .innerJoin(businesses, eq(branches.businessId, businesses.id))
      .where(and(eq(branches.businessId, scope.businessId), eq(branches.id, scope.branchId))));
    const row = rows[0];
    if (rows.length !== 1 || !row || !Number.isInteger(row.revision) || row.revision < 0) throw new Error('Display settings unavailable');
    const validated = validateBusinessConfiguration({ business: { name: row.businessName, currencyCode: row.currencyCode, timezone: row.timezone },
      branch: { name: row.branchName, ...(row.branchAddress === null ? {} : { address: row.branchAddress }) } });
    return { revision: row.revision, businessName: validated.business.name, branchName: validated.branch.name,
      branchAddress: validated.branch.address ?? null, currencyCode: validated.business.currencyCode, timezone: validated.business.timezone };
  }
  async replace(scope: DisplayScope, before: DisplayView, after: DisplayView, actorId: string, changedAt: Date, transaction: TransactionContext): Promise<void> {
    const db = transactionDatabase(transaction);
    const updated = await available(() => db.update(branches).set({ name: after.branchName, address: after.branchAddress, displayRevision: after.revision })
      .where(and(eq(branches.businessId, scope.businessId), eq(branches.id, scope.branchId), eq(branches.displayRevision, before.revision))).returning({ id: branches.id }));
    if (updated.length !== 1) throw new DisplaySettingsError('STALE_DISPLAY_SETTINGS', before.revision);
    await available(() => db.update(businesses).set({ name: after.businessName }).where(eq(businesses.id, scope.businessId)));
    await available(() => db.insert(businessDisplayHistory).values({ id: randomUUID(), ...scope, revision: after.revision, actorId, changedAt, before, after }));
  }
}
