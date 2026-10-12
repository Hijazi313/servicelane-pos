import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import {
  InstallationConflictError, InstallationContextError, validateBusinessConfiguration,
  type InstallationContext,
} from '../application/business-configuration.js';
import { businesses, branches, installationBinding } from './schema.js';

@Injectable()
export class BusinessService {
  constructor(private readonly database: DatabaseService) {}

  async createInitialBusiness(input: unknown, context: TransactionContext): Promise<InstallationContext> {
    const config = validateBusinessConfiguration(input);
    const db = transactionDatabase(context);
    const existing = await db.select({ id: businesses.id }).from(businesses).limit(1);
    if (existing.length) throw new InstallationConflictError();
    const businessId = randomUUID();
    const branchId = randomUUID();
    await db.insert(businesses).values({ id: businessId, ...config.business });
    await db.insert(branches).values({ id: branchId, businessId, ...config.branch });
    await db.insert(installationBinding).values({ singleton: 1, businessId, branchId });
    return { businessId, branchId, ...config };
  }

  async validateBranchOwnership(businessId: string, branchId: string, context: TransactionContext): Promise<void> {
    const db = transactionDatabase(context);
    const rows = await db.select({ branchId: branches.id }).from(branches)
      .innerJoin(installationBinding, and(eq(installationBinding.businessId, branches.businessId), eq(installationBinding.branchId, branches.id)))
      .where(and(eq(branches.businessId, businessId), eq(branches.id, branchId), eq(installationBinding.singleton, 1)));
    if (rows.length !== 1) throw new InstallationContextError();
  }

  async resolveInstallationContext(): Promise<InstallationContext> {
    const rows = await this.database.db.select({
      businessId: businesses.id, branchId: branches.id,
      businessName: businesses.name, currencyCode: businesses.currencyCode, timezone: businesses.timezone,
      branchName: branches.name, address: branches.address,
    }).from(installationBinding)
      .innerJoin(businesses, eq(installationBinding.businessId, businesses.id))
      .innerJoin(branches, and(eq(installationBinding.branchId, branches.id), eq(branches.businessId, businesses.id)))
      .where(eq(installationBinding.singleton, 1));
    const row = rows[0];
    if (rows.length !== 1 || !row) throw new InstallationContextError();
    const config = validateBusinessConfiguration({
      business: { name: row.businessName, currencyCode: row.currencyCode, timezone: row.timezone },
      branch: { name: row.branchName, ...(row.address === null ? {} : { address: row.address }) },
    });
    return { businessId: row.businessId, branchId: row.branchId, ...config };
  }
}
