import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { AuthenticationModule } from '../authentication/public.js';
import { BusinessModule } from '../business/public.js';
import { BusinessDisplayHttpModule } from '../business/http/public.js';
import { OrdersModule } from '../orders/public.js';
import { CashierShiftsModule } from '../cashier-shifts/public.js';
import { BillingService } from './application/billing.service.js';
import { BillingStore } from './application/billing-store.js';
import { BillingController } from './http/billing.controller.js';
import { PostgresBillingStore } from './infrastructure/postgres-billing-store.service.js';

// BP-01 source composition only. Deliberately absent from AppModule until activation authorization.
@Module({
  imports: [DatabaseModule, AuthenticationModule, BusinessModule, OrdersModule, BusinessDisplayHttpModule, CashierShiftsModule],
  controllers: [BillingController],
  providers: [BillingService, { provide: BillingStore, useClass: PostgresBillingStore }],
})
export class BillingModule {}
