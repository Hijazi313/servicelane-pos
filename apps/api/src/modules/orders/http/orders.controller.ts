import { Body, Controller, Get, Param, Post, Put, Req, UseFilters } from '@nestjs/common';
import { AccessEntry, proof, type AccessRequest } from '../../authentication/http/public.js';
import { OrdersService } from '../application/orders.service.js';
import { OrdersExceptionFilter } from './orders-exception.filter.js';
@Controller('api/v1/orders')
@UseFilters(OrdersExceptionFilter)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() @AccessEntry('staff')
  create(@Req() request: AccessRequest, @Body() value: unknown) { return this.orders.create(proof(request), value); }
  @Get('capture-policy') @AccessEntry('staff')
  policy(@Req() request: AccessRequest) { return this.orders.policy(proof(request)); }
  @Put('capture-policy') @AccessEntry('administrator')
  updatePolicy(@Req() request: AccessRequest, @Body() value: unknown) { return this.orders.updatePolicy(proof(request), value); }
  @Get(':id') @AccessEntry('staff')
  get(@Req() request: AccessRequest, @Param('id') id: string) { return this.orders.get(proof(request), id); }
}
