import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { AuthenticationModule } from '../authentication/public.js';
import { BusinessModule } from '../business/public.js';
import { DrawerService } from './application/drawer.service.js';
import { CashierSettlementService } from './application/cashier-settlement.service.js';
import { DrawerStore } from './application/drawer-store.js';
import { PostgresDrawerStore } from './infrastructure/postgres-drawer-store.service.js';
import { DrawerController } from './http/drawer.controller.js';

// Explicit composition only; AppModule does not activate these routes.
@Module({
  imports: [DatabaseModule, AuthenticationModule, BusinessModule],
  controllers: [DrawerController],
  providers: [DrawerService, CashierSettlementService, { provide: DrawerStore, useClass: PostgresDrawerStore }],
  exports: [CashierSettlementService],
})
export class CashierShiftsModule {}
