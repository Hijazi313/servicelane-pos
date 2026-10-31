import { KitchenModule } from './modules/kitchen/public.js';
import { BillingModule } from './modules/billing/public.js';
import { CashierShiftsModule } from './modules/cashier-shifts/public.js';
import { OrdersModule } from './modules/orders/public.js';
import { MenuModule } from './modules/menu/public.js';
import { AccessHttpModule } from './modules/authentication/http/access-http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { readConfiguration } from './infrastructure/configuration.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { HealthController } from './infrastructure/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => readConfiguration(process.env)] }),
    DatabaseModule,
    AccessHttpModule,
    MenuModule,
    OrdersModule,
    KitchenModule,
    BillingModule,
    CashierShiftsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
