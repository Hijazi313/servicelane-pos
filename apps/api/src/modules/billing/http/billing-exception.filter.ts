import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { HttpContractFilter } from '../../../infrastructure/http/http-contract.filter.js';
import { errorPolicy, httpProblem } from '../../../infrastructure/http/http-error-policy.js';
import { BillingError, type BillingErrorCode } from '../domain/billing.js';
@Catch(BillingError)
export class BillingExceptionFilter implements ExceptionFilter {
  catch(error: BillingError, host: ArgumentsHost): void {
    new HttpContractFilter({ catch: () => { throw error; } }, errorPolicy(failure => {
      if (!(failure instanceof BillingError)) return undefined;
      const status = billingStatus(failure.code);
      const details = failure.details;
      return { ...httpProblem(status, failure.code), ...(details && failure.code === 'STALE_ASSESSMENT'
        && 'policyRevision' in details ? { details: { policyRevision: details.policyRevision, displayRevision: details.displayRevision } }
        : details && (failure.code === 'STALE_BILLING_POLICY') && 'revision' in details ? { details: { revision: details.revision } } : {}) };
    })).catch(error, host);
  }
}

function billingStatus(code: BillingErrorCode): 400 | 404 | 409 | 503 {
  switch (code) {
    case 'INVALID_BILLING_INPUT': return 400;
    case 'ORDER_NOT_FOUND': case 'BILL_NOT_FOUND': return 404;
    case 'BILLING_UNAVAILABLE': return 503;
    case 'BILLING_POLICY_UNCONFIGURED': case 'STALE_ASSESSMENT': case 'STALE_BILLING_POLICY':
    case 'SETTLEMENT_RETRY_CONFLICT': case 'ORDER_ALREADY_SETTLED': case 'BILL_CAPACITY':
    case 'POLICY_CAPACITY': case 'BILL_AMOUNT_OVERFLOW': case 'UNSUPPORTED_BILL_CURRENCY':
    case 'UNSUPPORTED_ZERO_PAYABLE': case 'REVISION_CAPACITY': return 409;
    default: { const exhaustive: never = code; throw new Error(`Unknown Billing error ${exhaustive}`); }
  }
}
