import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { AccessError, type AccessErrorReason } from '../application/access-policy.js';
import { HttpContractFilter } from '../../../infrastructure/http/http-contract.filter.js';
import { usesHttpContract } from '../../../infrastructure/http/http-contract.decorator.js';
import { errorPolicy, httpProblem } from '../../../infrastructure/http/http-error-policy.js';
import { type AccessReply } from './access-http.helpers.js';

const accessStatuses: Record<AccessErrorReason, 400 | 401 | 403 | 404 | 409 | 429 | 503> = {
  INVALID_INPUT: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, RATE_LIMITED: 429, UNAVAILABLE: 503,
};
@Catch()
export class AccessExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    if (usesHttpContract(host)) {
      new HttpContractFilter(this, errorPolicy(error => error instanceof AccessError
        ? { ...httpProblem(accessStatuses[error.reason], `ACCESS_${error.reason}`), ...(error.retryDelaySeconds ? { retryAfter: error.retryDelaySeconds } : {}) }
        : undefined)).catch(error, host);
      return;
    }
    const reply = host.switchToHttp().getResponse<AccessReply>();
    if (error instanceof AccessError) {
      const status = accessStatuses[error.reason] ?? 503;
      if (error.retryDelaySeconds) reply.header('Retry-After', String(error.retryDelaySeconds));
      reply.header('Cache-Control', 'no-store').status(status).send({ statusCode: status, message: error.message });
      return;
    }
    // Preserve the accepted technical health failure contract without forwarding arbitrary errors.
    if (error instanceof HttpException && error.getStatus() === 503) {
      const body = error.getResponse();
      if (typeof body === 'object' && body !== null && Object.keys(body).length === 1 && 'status' in body && body.status === 'unavailable') {
        reply.status(503).send({ status: 'unavailable' }); return;
      }
    }
    const status = error instanceof HttpException ? error.getStatus() : 503;
    const message = status === 404 ? 'Resource not found' : status === 400 ? 'Invalid input' : status === 409 ? 'Conflict' : status === 413 ? 'Request too large' : 'Service unavailable';
    reply.header('Cache-Control', 'no-store').status(status).send({ statusCode: status, message });
  }
}
