import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { MenuStore } from '../application/menu-store.js';
import { MenuError, references, type Offering } from '../domain/catalogue.js';
import { menuOfferings, menuReferences, menuVariants } from './schema.js';
@Injectable()
export class PostgresMenuStore extends MenuStore {
  constructor(private readonly database: DatabaseService) { super(); }
  async read(businessId: string, transaction?: TransactionContext): Promise<Offering[]> {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    // One SELECT = one coherent Menu snapshot, including referenced item definitions.
    const rows = await db.select({ definition: menuOfferings.definition }).from(menuOfferings)
      .where(eq(menuOfferings.businessId, businessId)).orderBy(menuOfferings.id).limit(501);
    if (rows.length > 500) throw new MenuError('CATALOGUE_UNAVAILABLE', 'Catalogue capacity exceeded');
    return rows.map(row => row.definition);
  }
  async save(businessId: string, offering: Offering, expectedRevision: number | undefined, transaction: TransactionContext) {
    const db = transactionDatabase(transaction);
    const row = { id: offering.id, businessId, revision: offering.revision, currencyCode: offering.currencyCode, scale: offering.scale, definition: offering };
    if (expectedRevision === undefined) await db.insert(menuOfferings).values(row);
    else {
      const updated = await db.update(menuOfferings).set({ revision: row.revision, definition: row.definition })
        .where(and(eq(menuOfferings.businessId, businessId), eq(menuOfferings.id, offering.id), eq(menuOfferings.revision, expectedRevision))).returning({ id: menuOfferings.id });
      if (!updated.length) throw new MenuError('STALE_REVISION', 'Stale offering revision');
    }
    if (offering.kind === 'item') {
      const existing = await db.select({ id: menuVariants.id }).from(menuVariants)
        .where(and(eq(menuVariants.businessId, businessId), eq(menuVariants.offeringId, offering.id)));
      const additions = offering.variants.filter(variant => !existing.some(row => row.id === variant.id));
      if (additions.length) await db.insert(menuVariants).values(additions.map(variant => ({ businessId, offeringId: offering.id, id: variant.id })));
    } else {
      await db.delete(menuReferences).where(and(eq(menuReferences.businessId, businessId), eq(menuReferences.offeringId, offering.id)));
      const refs = references(offering);
      if (refs.length) await db.insert(menuReferences).values(refs.map(variantId => ({ businessId, offeringId: offering.id, variantId })));
    }
  }
}
