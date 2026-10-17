import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../infrastructure/database/database.service.js';
import { inTransaction, transactionDatabase } from '../infrastructure/database/transaction.js';
import { BusinessService, BusinessValidationError, validateBusinessConfiguration } from '../modules/business/public.js';
import { AdministratorProvisioner, validateInitialAdministrator, validateInitialPassword } from '../modules/authentication/public.js';

export function validateProvisioningInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !['business', 'branch', 'administrator'].includes(key))) {
    throw new BusinessValidationError('Provisioning requires business, branch and administrator configuration only');
  }
  const input = value as Record<string, unknown>;
  return {
    ...validateBusinessConfiguration({ business: input.business, branch: input.branch }),
    administrator: validateInitialAdministrator(input.administrator),
  };
}

@Injectable()
export class ProvisionInstallation {
  constructor(
    private readonly database: DatabaseService,
    private readonly business: BusinessService,
    private readonly authentication: AdministratorProvisioner,
  ) {}

  async execute(input: unknown, password: string): Promise<{ businessId: string; branchId: string; accountId: string }> {
    // Validate before acquiring a connection; passwords never enter configuration/results.
    const config = validateProvisioningInput(input);
    validateInitialPassword(password);
    return inTransaction(this.database.db, async (context) => {
      // Transaction-scoped, shared by all bootstrap attempts in this database.
      await transactionDatabase(context).execute(sql`select pg_advisory_xact_lock(726501, 1)`);
      const { businessId, branchId } = await this.business.createInitialBusiness({ business: config.business, branch: config.branch }, context);
      const { accountId } = await this.authentication.createInitialAdministrator(config.administrator, password, businessId, branchId, context);
      return { businessId, branchId, accountId };
    });
  }
}
