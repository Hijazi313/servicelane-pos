import { HttpContractGuard } from '../../../infrastructure/http/http-contract.guard.js';
import { HttpResponseInterceptor } from '../../../infrastructure/http/http-response.interceptor.js';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthenticationModule } from '../authentication.module.js';
import { AccessController } from './access.controller.js';
import { AccessBoundaryGuard } from './access-boundary.guard.js';
import { AccessExceptionFilter } from './access-exception.filter.js';
import { AccessHttpConfiguration, readAccessHttpConfiguration } from './configuration.js';
@Module({ imports: [AuthenticationModule], controllers: [AccessController], providers: [
  { provide: AccessHttpConfiguration, useFactory: () => readAccessHttpConfiguration(process.env) },
  { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_GUARD, useClass: AccessBoundaryGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor }, { provide: APP_FILTER, useClass: AccessExceptionFilter },
] })
export class AccessHttpModule {}
