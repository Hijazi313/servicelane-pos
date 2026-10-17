import { Injectable } from '@nestjs/common';
import { BusinessService } from '../../business/public.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { ProvisionInitialAdministrator, type AdministratorPersistence } from '../application/administrator-provisioner.js';
import { hashInitialPassword } from './password-hash.js';
import { staffAccounts, staffBranchGrants, staffCredentials } from './schema.js';

class SqlAdministratorPersistence implements AdministratorPersistence {
  async hasAccounts(context: TransactionContext): Promise<boolean> {
    return (await transactionDatabase(context).select({ id: staffAccounts.id }).from(staffAccounts).limit(1)).length > 0;
  }
  async create(input: Parameters<AdministratorPersistence['create']>[0], context: TransactionContext): Promise<void> {
    const db = transactionDatabase(context);
    await db.insert(staffAccounts).values({
      id: input.accountId, businessId: input.businessId, username: input.username, displayName: input.displayName,
      status: 'active', role: 'administrator', passwordChangeRequired: true,
    });
    await db.insert(staffCredentials).values({ accountId: input.accountId, passwordHash: input.passwordHash });
    await db.insert(staffBranchGrants).values({ businessId: input.businessId, accountId: input.accountId, branchId: input.branchId });
  }
}
// Compatibility entry point for accepted bootstrap callers and Nest composition.
@Injectable()
export class AdministratorProvisioner extends ProvisionInitialAdministrator {
  constructor(business: BusinessService) { super(business, new SqlAdministratorPersistence(), hashInitialPassword); }
}
