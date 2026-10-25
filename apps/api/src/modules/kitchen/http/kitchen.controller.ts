import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseFilters } from '@nestjs/common';
import { AccessEntry, proof, type AccessRequest } from '../../authentication/http/public.js';
import { HttpContract } from '../../../infrastructure/http/http-contract.decorator.js';
import { DtoValidationPipe } from '../../../infrastructure/http/dto-validation.pipe.js';
import { EmptyQueryDto } from '../../../infrastructure/http/empty-query.dto.js';
import { HttpPage } from '../../../infrastructure/http/http-response.interceptor.js';
import { KitchenService } from '../application/kitchen.service.js';
import type { TicketSummary, TicketView } from '../application/kitchen-store.js';
import { AdvanceTicketDto, DispatchTicketDto, TicketParamsDto, TicketQueueQueryDto } from './kitchen-input.dto.js';
import { KitchenExceptionFilter } from './kitchen-exception.filter.js';
@Controller('api/v1/kitchen/tickets')
@UseFilters(KitchenExceptionFilter)
export class KitchenController {
  constructor(private readonly kitchen: KitchenService) {}
  @Post() @AccessEntry('staff') @HttpContract()
  async dispatch(@Req() request: AccessRequest,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: DispatchTicketDto,
    @Res({ passthrough: true }) reply: { header(name: string, value: string): unknown },
  ): Promise<TicketView> {
    const ticket = await this.kitchen.dispatch(proof(request), body);
    reply.header('Location', `/api/v1/kitchen/tickets/${ticket.id}`);
    return ticket;
  }
  @Get() @AccessEntry('staff') @HttpContract()
  async list(@Req() request: AccessRequest,
    @Query(new DtoValidationPipe('query')) query: TicketQueueQueryDto,
  ): Promise<HttpPage<TicketSummary>> {
    const page = await this.kitchen.list(proof(request), query);
    return new HttpPage(page.tickets, page.nextCursor ?? null);
  }
  @Get(':id') @AccessEntry('staff') @HttpContract()
  get(@Req() request: AccessRequest,
    @Param(new DtoValidationPipe('path')) params: TicketParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
  ): Promise<TicketView> { return this.kitchen.get(proof(request), params.id); }
  @Put(':id/state') @AccessEntry('staff') @HttpContract()
  advance(@Req() request: AccessRequest,
    @Param(new DtoValidationPipe('path')) params: TicketParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: AdvanceTicketDto,
  ): Promise<TicketView> { return this.kitchen.advance(proof(request), params.id, body); }
}
