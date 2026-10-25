import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { HttpContractFilter } from '../../../infrastructure/http/http-contract.filter.js';
import { errorPolicy, httpProblem } from '../../../infrastructure/http/http-error-policy.js';
import { KitchenError, type KitchenErrorCode } from '../domain/preparation.js';
const statuses: Record<KitchenErrorCode, 400 | 404 | 409 | 503> = {
  INVALID_KITCHEN_INPUT: 400, INVALID_KITCHEN_CURSOR: 400,
  TICKET_NOT_FOUND: 404, ORDER_NOT_FOUND: 404,
  STALE_TICKET: 409, TICKET_CAPACITY: 409, KITCHEN_UNAVAILABLE: 503,
};
@Catch(KitchenError)
export class KitchenExceptionFilter implements ExceptionFilter {
  catch(error: KitchenError, host: ArgumentsHost): void {
    // All Kitchen methods adopt this contract; Access/framework/unexpected errors
    // remain owned by the shared global filter.
    new HttpContractFilter({ catch: () => { throw error; } }, errorPolicy(failure => {
      if (!(failure instanceof KitchenError)) return undefined;
      return { ...httpProblem(statuses[failure.code], failure.code),
        ...(failure.code === 'STALE_TICKET' && failure.current
          ? { details: { state: failure.current.state, revision: failure.current.revision } } : {}) };
    })).catch(error, host);
  }
}
