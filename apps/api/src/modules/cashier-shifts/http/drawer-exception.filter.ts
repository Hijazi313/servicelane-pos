import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { HttpContractFilter } from '../../../infrastructure/http/http-contract.filter.js';
import { errorPolicy, httpProblem } from '../../../infrastructure/http/http-error-policy.js';
import { DrawerError } from '../domain/drawer-session.js';

// Unknown errors are deliberately left to the shared safe unexpected-error policy.
const statuses: Readonly<Record<string, 400 | 403 | 404 | 409 | 503>> = {
  INVALID_INPUT: 400, INVALID_AMOUNT: 400, INVALID_DIRECTION: 400, INVALID_REASON: 400, INVALID_OPEN: 400,
  FORBIDDEN: 403, DRAWER_NOT_FOUND: 404,
  AMOUNT_CAPACITY: 409, DRAWER_CLOSED: 409, HANDOVER_PENDING: 409, INSUFFICIENT_CASH: 409,
  INVALID_HANDOVER: 409, NOT_CUSTODIAN: 409, REVISION_CAPACITY: 409, STALE_DRAWER: 409, CURRENCY_MISMATCH: 409,
  RETRY_CONFLICT: 409, DRAWER_EXISTS: 409, DRAWER_CAPACITY: 409, POLICY_UNCONFIGURED: 409, DRAWER_BUSY: 409,
  STALE_POLICY: 409, INVALID_REPLACEMENT: 409, INVALID_RECIPIENT: 409,
};
@Catch(DrawerError)
export class DrawerExceptionFilter implements ExceptionFilter {
  catch(error: DrawerError, host: ArgumentsHost): void {
    new HttpContractFilter({ catch: () => { throw error; } }, errorPolicy(failure => {
      if (!(failure instanceof DrawerError)) return undefined;
      const status = Object.hasOwn(statuses, failure.code) ? statuses[failure.code] : undefined;
      return status === undefined ? undefined : httpProblem(status, failure.code);
    })).catch(error, host);
  }
}
