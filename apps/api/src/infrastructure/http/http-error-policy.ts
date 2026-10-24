import { Logger } from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { HttpCompletion } from './http-adapter.js';
import type { HttpErrorPolicy } from './http-contract.filter.js';
import type { ProblemDefinition } from './problem-details.js';

const logger = new Logger('HttpBoundary');

export function httpProblem(status: number, code: string): ProblemDefinition {
  return { status, type: `/problems/${code.toLowerCase().replaceAll('_', '-')}`, title: STATUS_CODES[status] ?? 'Request failed', code };
}

export function errorPolicy(map: HttpErrorPolicy['map']): HttpErrorPolicy {
  return {
    map,
    framework: status => httpProblem(status, `HTTP_${status}`),
    unexpected: () => httpProblem(500, 'INTERNAL_ERROR'),
    reportUnexpected(error, requestId) {
      // Avoid exception messages/stacks containing SQL, tokens or customer input.
      const kind = error instanceof TypeError ? 'TypeError' : error instanceof RangeError ? 'RangeError' : 'Error';
      logger.error({ event: 'unexpected-http-error', requestId, kind });
    },
  };
}

export function reportHttpCompletion(event: HttpCompletion): void {
  logger.log({ event: 'http-completed', ...event });
}
