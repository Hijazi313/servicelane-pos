import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CURRENCY_PRECISION } from '../../../common/currency-precision.js';
import { AccessService, type AuthorizedScope, type Proof } from '../../authentication/public.js';
import { OrderFinancialService } from '../../orders/public.js';
import { DisplaySettingsService } from '../../business/public.js';
import { BillingStore, type BillingScope } from './billing-store.js';
import { BillingError, assertBillCapacity, assertPolicyCapacity, assertRuleIdentities, calculateAssessment,
  canonical, identifier, initialPolicy, normalizeAssessment, normalizePolicyReplacement, normalizeSettlement,
  type AssessmentView, type BillView, type PolicyView } from '../domain/billing.js';

@Injectable()
export class BillingService {
  constructor(private readonly access: AccessService, private readonly orders: OrderFinancialService,
    private readonly display: DisplaySettingsService, private readonly store: BillingStore) {}

  private async context(proof: Proof): Promise<BillingScope> {
    const context = await this.access.me(proof, true);
    if (!('business' in context)) throw new BillingError('BILLING_UNAVAILABLE');
    return { businessId: context.businessId, branchId: context.branchId };
  }
  async getPolicy(proof: Proof): Promise<PolicyView> {
    return await this.store.policy(await this.context(proof)) ?? initialPolicy();
  }
  async replacePolicy(proof: Proof, input: unknown): Promise<PolicyView> {
    const replacement = normalizePolicyReplacement(input);
    return this.access.runAuthorized(proof, 'administrator', async scope => {
      const current = await this.store.policy(scope.installation, scope.transaction) ?? initialPolicy();
      if (replacement.expectedRevision !== current.revision) throw new BillingError('STALE_BILLING_POLICY', { revision: current.revision });
      const next = { ...replacement.policy, revision: current.revision };
      // Current monetary context must be consulted even for an otherwise identical configured replacement.
      const display = await this.display.get(scope);
      if (next.status === 'configured' && (next.currencyCode !== display.currencyCode || next.scale !== CURRENCY_PRECISION[display.currencyCode])) throw new BillingError('UNSUPPORTED_BILL_CURRENCY');
      await assertRuleIdentities(current, next, await this.store.retiredRuleIds(scope.installation, scope.transaction));
      assertPolicyCapacity(next);
      if (canonical(current) === canonical(next)) return current;
      if (current.revision === 2_147_483_647) throw new BillingError('REVISION_CAPACITY');
      next.revision++;
      assertPolicyCapacity(next);
      await this.store.replacePolicy(scope.installation, { previous: current, next, actorId: scope.actorId,
        changedAt: new Date().toISOString(), configurationNote: replacement.configurationNote }, scope.transaction);
      return next;
    });
  }
  private async assessment(scope: AuthorizedScope, orderId: string, optionalChargeIds: string[],
    expected?: { expectedPolicyRevision: number; expectedDisplayRevision: number }): Promise<AssessmentView> {
    const order = await this.orders.get(scope, orderId);
    if (!order) throw new BillingError('ORDER_NOT_FOUND');
    const policy = await this.store.policy(scope.installation, scope.transaction) ?? initialPolicy();
    const display = await this.display.get(scope);
    if (order.currencyCode !== display.currencyCode || order.scale !== CURRENCY_PRECISION[display.currencyCode]) throw new BillingError('UNSUPPORTED_BILL_CURRENCY');
    if (policy.status !== 'configured') throw new BillingError('BILLING_POLICY_UNCONFIGURED');
    if (policy.currencyCode !== order.currencyCode || policy.scale !== order.scale) throw new BillingError('UNSUPPORTED_BILL_CURRENCY');
    if (expected && (expected.expectedPolicyRevision !== policy.revision || expected.expectedDisplayRevision !== display.revision)) {
      throw new BillingError('STALE_ASSESSMENT', { policyRevision: policy.revision, displayRevision: display.revision });
    }
    return calculateAssessment(order, policy, display, optionalChargeIds);
  }
  async assess(proof: Proof, input: unknown): Promise<AssessmentView> {
    const request = normalizeAssessment(input);
    return this.access.runAuthorized(proof, 'staff', async scope => {
      if (await this.store.forOrder(scope.installation, request.orderId, scope.transaction)) throw new BillingError('ORDER_ALREADY_SETTLED');
      return this.assessment(scope, request.orderId, request.optionalChargeIds);
    });
  }
  async settle(proof: Proof, input: unknown): Promise<BillView> {
    const request = normalizeSettlement(input);
    return this.access.runAuthorized(proof, 'staff', async scope => {
      const existing = await this.store.forRetry(scope.installation, request.retryKey, scope.transaction);
      if (existing) {
        if (canonical(existing.request) !== canonical(request)) throw new BillingError('SETTLEMENT_RETRY_CONFLICT');
        return existing.bill;
      }
      if (await this.store.forOrder(scope.installation, request.orderId, scope.transaction)) throw new BillingError('ORDER_ALREADY_SETTLED');
      const assessment = await this.assessment(scope, request.orderId, request.optionalChargeIds, request);
      if (request.expectedCurrencyCode !== assessment.currencyCode || request.expectedScale !== assessment.scale
        || request.expectedPayableMinor !== assessment.payableMinor) throw new BillingError('STALE_ASSESSMENT', {
          policyRevision: assessment.billingPolicy.revision, displayRevision: assessment.businessDisplay.revision,
        });
      const bill: BillView = { ...assessment, id: randomUUID(), settledAt: new Date().toISOString(),
        payment: { method: 'cash', amountMinor: assessment.payableMinor } };
      assertBillCapacity(bill);
      await this.store.insert(scope.installation, { bill, request, actorId: scope.actorId }, scope.transaction);
      return bill;
    });
  }
  async get(proof: Proof, input: unknown): Promise<BillView> {
    const orderId = identifier(input), scope = await this.context(proof);
    const record = await this.store.forOrder(scope, orderId);
    if (!record) throw new BillingError('BILL_NOT_FOUND');
    return record.bill;
  }
}
