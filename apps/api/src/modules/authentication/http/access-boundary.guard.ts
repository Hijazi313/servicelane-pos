import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessService } from '../application/access.service.js';
import { AccessError } from '../application/access-policy.js';
import { AccessHttpConfiguration } from './configuration.js';
import { header, proof, type AccessRequest, type AccessReply } from './access-http.helpers.js';

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
