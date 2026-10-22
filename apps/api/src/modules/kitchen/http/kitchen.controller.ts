import { Body, Controller, Get, Param, Post, Put, Query, Req, UseFilters } from '@nestjs/common';
import { AccessEntry, proof, type AccessRequest } from '../../authentication/http/public.js';
import { KitchenService } from '../application/kitchen.service.js';
import { KitchenExceptionFilter } from './kitchen-exception.filter.js';
@Controller('api/v1/kitchen/tickets')
@UseFilters(KitchenExceptionFilter)
export class KitchenController {
  constructor(private readonly kitchen: KitchenService) {}
  @Post() @AccessEntry('staff')
  dispatch(@Req() request: AccessRequest, @Body() body: unknown) { return this.kitchen.dispatch(proof(request), body); }
  @Get() @AccessEntry('staff')
  list(@Req() request: AccessRequest, @Query() query: unknown) { return this.kitchen.list(proof(request), query); }
  @Get(':id') @AccessEntry('staff')
  get(@Req() request: AccessRequest, @Param('id') id: string) { return this.kitchen.get(proof(request), id); }
  @Put(':id/state') @AccessEntry('staff')
  advance(@Req() request: AccessRequest, @Param('id') id: string, @Body() body: unknown) { return this.kitchen.advance(proof(request), id, body); }
}
