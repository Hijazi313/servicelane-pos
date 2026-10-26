import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../../authentication/public.js';
import { BusinessModule } from '../business.module.js';
import { BusinessDisplayController } from './business-display.controller.js';
import { BusinessDisplayService } from './business-display.service.js';
// Deliberately unmounted: source/offline BP-01 composition only.
@Module({ imports: [AuthenticationModule, BusinessModule], controllers: [BusinessDisplayController], providers: [BusinessDisplayService] })
export class BusinessDisplayHttpModule {}
