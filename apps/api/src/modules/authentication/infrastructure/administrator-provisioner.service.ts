import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BusinessService, InstallationConflictError } from '../../business/public.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { validateInitialAdministrator } from '../application/initial-administrator.js';
import { hashInitialPassword } from './password-hash.js';
import { staffAccounts, staffBranchGrants, staffCredentials } from './schema.js';

@Injectable()
export class AdministratorProvisioner {
  constructor(private readonly business: BusinessService) {}

  async createInitialAdministrator(input: unknown, password: string, businessId: string, branchId: string, context: TransactionContext): Promise<{ accountId: string }> {
    const administrator = validateInitialAdministrator(input);
    const db = transactionDatabase(context);
    if ((await db.select({ id: staffAccounts.id }).from(staffAccounts).limit(1)).length) throw new InstallationConflictError();
    await this.business.validateBranchOwnership(businessId, branchId, context);
    const passwordHash = await hashInitialPassword(password);
    const accountId = randomUUID();
    await db.insert(staffAccounts).values({
      id: accountId, businessId, ...administrator, status: 'active', role: 'administrator', passwordChangeRequired: true,
    });
    await db.insert(staffCredentials).values({ accountId, passwordHash });
    await db.insert(staffBranchGrants).values({ businessId, accountId, branchId });
    return { accountId };
  }
}
