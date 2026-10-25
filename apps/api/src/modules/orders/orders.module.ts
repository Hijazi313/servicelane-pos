import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module.js";
import { AuthenticationModule } from "../authentication/public.js";
import { MenuModule } from "../menu/public.js";
import { OrderPreparationService } from "./application/order-preparation.service.js";
import { OrdersService } from "./application/orders.service.js";
import { OrderStore } from "./application/order-store.js";
import { PostgresOrderStore } from "./infrastructure/postgres-order-store.service.js";
import { OrdersController } from "./http/orders.controller.js";
@Module({
  imports: [DatabaseModule, AuthenticationModule, MenuModule],
  controllers: [OrdersController],
  exports: [OrderPreparationService],
  providers: [
    OrderPreparationService,
    OrdersService,
    { provide: OrderStore, useClass: PostgresOrderStore },
  ],
})
export class OrdersModule {}
