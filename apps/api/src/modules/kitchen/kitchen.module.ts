import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { AuthenticationModule } from '../authentication/public.js';
import { OrdersModule } from '../orders/public.js';
import { KitchenService } from './application/kitchen.service.js';
import { KitchenStore } from './application/kitchen-store.js';
import { PostgresKitchenStore } from './infrastructure/postgres-kitchen-store.service.js';
import { KitchenController } from './http/kitchen.controller.js';
@Module({ imports: [DatabaseModule, AuthenticationModule, OrdersModule], controllers: [KitchenController],
  providers: [KitchenService, { provide: KitchenStore, useClass: PostgresKitchenStore }] })
export class KitchenModule {}
