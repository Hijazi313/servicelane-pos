import { SetMetadata, type ArgumentsHost, type ExecutionContext } from '@nestjs/common';

const CONTRACT_METADATA = 'http-contract';
const REQUEST_CONTRACT = Symbol('http-contract');
interface ContractRequest { [REQUEST_CONTRACT]?: boolean }

/** Opt in only after the endpoint's public contract migration is approved. */
export const HttpContract = (): MethodDecorator => SetMetadata(CONTRACT_METADATA, true);

/** Capture while ExecutionContext still has handler metadata, before admission. */
export function captureHttpContract(context: ExecutionContext): void {
  context.switchToHttp().getRequest<ContractRequest>()[REQUEST_CONTRACT] =
    Reflect.getMetadata(CONTRACT_METADATA, context.getHandler()) === true;
}

export function usesHttpContract(host: ArgumentsHost): boolean {
  return host.switchToHttp().getRequest<ContractRequest>()[REQUEST_CONTRACT] === true;
}
