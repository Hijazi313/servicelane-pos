import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseFilters,
} from "@nestjs/common";
import {
  AccessEntry,
  proof,
  type AccessRequest,
} from "../../authentication/http/public.js";
import { HttpContract } from "../../../infrastructure/http/http-contract.decorator.js";
import { DtoValidationPipe } from "../../../infrastructure/http/dto-validation.pipe.js";
import { CreateOrderDto } from "./create-order.dto.js";
import type { OrderSnapshot } from "../application/order-store.js";
import { OrdersService } from "../application/orders.service.js";
import { OrdersExceptionFilter } from "./orders-exception.filter.js";
@Controller("api/v1/orders")
@UseFilters(OrdersExceptionFilter)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post()
  @AccessEntry("staff")
  @HttpContract()
  async create(
    @Req() request: AccessRequest,
    @Body(new DtoValidationPipe()) value: CreateOrderDto,
    @Res({ passthrough: true })
    reply: { header(name: string, value: string): unknown },
  ): Promise<OrderSnapshot> {
    const result = await this.orders.create(proof(request), value);
    reply.header("Location", `/api/v1/orders/${result.id}`);
    return result;
  }
  @Get("capture-policy")
  @AccessEntry("staff")
  policy(@Req() request: AccessRequest) {
    return this.orders.policy(proof(request));
  }
  @Put("capture-policy")
  @AccessEntry("administrator")
  updatePolicy(@Req() request: AccessRequest, @Body() value: unknown) {
    return this.orders.updatePolicy(proof(request), value);
  }
  @Get(":id")
  @AccessEntry("staff")
  get(@Req() request: AccessRequest, @Param("id") id: string) {
    return this.orders.get(proof(request), id);
  }
}
