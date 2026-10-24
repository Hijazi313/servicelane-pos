import { HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { usesHttpContract } from './http-contract.decorator.js';
import { writeProblemDetails, type ProblemDefinition, type ProblemReply } from './problem-details.js';

export interface HttpErrorPolicy {
  map(error: unknown): ProblemDefinition | undefined;
  framework(status: number): ProblemDefinition;
  unexpected(): ProblemDefinition;
  /** Single diagnostic owner; must be nonthrowing and apply safe logging policy. */
  reportUnexpected(error: unknown, requestId: string): void;
}
interface Request { id: string }

/** Compose explicitly with module mappings and legacy fallback, not a registry. */
export class HttpContractFilter implements ExceptionFilter {
  constructor(private readonly legacy: ExceptionFilter, private readonly policy: HttpErrorPolicy) {}
  catch(error: unknown, host: ArgumentsHost): void {
    if (!usesHttpContract(host)) { this.legacy.catch(error, host); return; }
    const requestId = host.switchToHttp().getRequest<Request>().id;
    let problem = this.policy.map(error);
    if (!problem && error instanceof HttpException) problem = this.policy.framework(error.getStatus());
    if (!problem) {
      this.policy.reportUnexpected(error, requestId);
      problem = this.policy.unexpected();
    }
    writeProblemDetails(host.switchToHttp().getResponse<ProblemReply>(), requestId, problem);
  }
}
