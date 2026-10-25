import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { captureHttpContract } from './http-contract.decorator.js';

/** Metadata capture only. Register before access guards; does not authorize. */
@Injectable()
export class HttpContractGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    captureHttpContract(context);
    return true;
  }
}
