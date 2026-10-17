import { Catch, Injectable, SetMetadata, type ArgumentsHost, type CanActivate, type ExecutionContext, type ExceptionFilter, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessService, type Proof } from '../application/access.service.js';
import { AccessError } from '../application/access-policy.js';
import { AccessHttpConfiguration } from './configuration.js';

export interface AccessRequest {
  method: string; protocol: string; ip: string; body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
export interface AccessReply {
  header(name: string, value: string | string[]): AccessReply;
  status(code: number): AccessReply;
  send(body?: unknown): unknown;
}
export const AccessEntry = (policy: 'public' | 'staff' | 'administrator' | 'restricted' | 'health') => SetMetadata('access-entry', policy);
export function header(request: AccessRequest, name: string): string | undefined {
  const value = request.headers[name]; return typeof value === 'string' ? value : undefined;
}
export function proof(request: AccessRequest): Proof {
  const cookies = header(request, 'cookie') ?? '';
  if (cookies.length > 4096) throw new AccessError(400, 'Invalid cookies');
  const result: Proof = { csrf: header(request, 'x-csrf-token') };
  for (const [name, key] of [['__Host-session', 'session'], ['__Host-prelogin', 'prelogin']] as const) {
    const values = cookies.split(';').map((item) => item.trim()).filter((item) => item.startsWith(`${name}=`));
    if (values.length > 1) throw new AccessError(400, 'Invalid cookies');
    if (values[0]) result[key] = values[0].slice(name.length + 1);
  }
  return result;
}
export function cookie(name: '__Host-session' | '__Host-prelogin', value: string, clear = false): string {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict${clear ? '; Max-Age=0' : ''}`;
}
@Injectable()
export class AccessBoundaryGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly config: AccessHttpConfiguration, private readonly access: AccessService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.get<string>('access-entry', context.getHandler());
    if (!policy) throw new AccessError(401, 'Authentication required');
    if (policy === 'health') return true;
    const request = context.switchToHttp().getRequest<AccessRequest>();
    const response = context.switchToHttp().getResponse<AccessReply>();
    response.header('Cache-Control', 'no-store');
    if (header(request, 'host') !== this.config.authority || request.protocol !== 'https') throw new AccessError(403, 'Unapproved client origin');
    const origin = header(request, 'origin');
    if (origin !== undefined && origin !== this.config.origin) throw new AccessError(403, 'Unapproved client origin');
    if (!['GET', 'HEAD'].includes(request.method) && origin !== this.config.origin) throw new AccessError(403, 'Unapproved client origin');
    if (policy !== 'public') await this.access.authorize(proof(request), policy === 'administrator', policy === 'restricted');
    return true;
  }
}
@Catch()
export class AccessExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<AccessReply>();
    if (error instanceof AccessError) {
      if (error.retryAfter) reply.header('Retry-After', String(error.retryAfter));
      reply.header('Cache-Control', 'no-store').status(error.status).send({ statusCode: error.status, message: error.message });
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
    const message = status === 404 ? 'Resource not found' : status === 400 ? 'Invalid input' : status === 413 ? 'Request too large' : 'Service unavailable';
    reply.header('Cache-Control', 'no-store').status(status).send({ statusCode: status, message });
  }
}
