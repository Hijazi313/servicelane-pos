import { randomUUID } from 'node:crypto';
import { InstallationConflictError, type BusinessService } from '../../business/public.js';
import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import { validateInitialAdministrator, validateInitialPassword, type InitialAdministrator } from './initial-administrator.js';

export interface AdministratorPersistence {
  hasAccounts(context: TransactionContext): Promise<boolean>;
  create(input: InitialAdministrator & { accountId: string; businessId: string; branchId: string; passwordHash: string }, context: TransactionContext): Promise<void>;
}
export class ProvisionInitialAdministrator {
  constructor(
    private readonly business: Pick<BusinessService, 'validateBranchOwnership'>,
    private readonly persistence: AdministratorPersistence,
    private readonly hash: (password: string) => Promise<string>,
  ) {}
  async createInitialAdministrator(input: unknown, password: string, businessId: string, branchId: string, context: TransactionContext): Promise<{ accountId: string }> {
    const administrator = validateInitialAdministrator(input);
    validateInitialPassword(password);
    if (await this.persistence.hasAccounts(context)) throw new InstallationConflictError();
    await this.business.validateBranchOwnership(businessId, branchId, context);
    const passwordHash = await this.hash(password);
    const accountId = randomUUID();
    await this.persistence.create({ ...administrator, accountId, businessId, branchId, passwordHash }, context);
    return { accountId };
  }
}
