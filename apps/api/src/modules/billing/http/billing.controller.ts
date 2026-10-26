import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, Res, UseFilters } from '@nestjs/common';
import { AccessEntry, proof, type AccessRequest } from '../../authentication/http/public.js';
import { HttpContract } from '../../../infrastructure/http/http-contract.decorator.js';
import { DtoValidationPipe } from '../../../infrastructure/http/dto-validation.pipe.js';
import { EmptyQueryDto } from '../../../infrastructure/http/empty-query.dto.js';
import { BillingService } from '../application/billing.service.js';
import type { AssessmentView, BillView, PolicyView } from '../domain/billing.js';
import { AssessmentDto, BillParamsDto, PolicyReplacementDto, SettlementDto } from './billing-input.dto.js';
import { BillingExceptionFilter } from './billing-exception.filter.js';
@Controller('api/v1/billing')
@UseFilters(BillingExceptionFilter)
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get('policy') @AccessEntry('staff') @HttpContract()
  policy(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto): Promise<PolicyView> {
    return this.billing.getPolicy(proof(request));
  }
  @Put('policy') @AccessEntry('administrator') @HttpContract()
  replacePolicy(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: PolicyReplacementDto): Promise<PolicyView> {
    return this.billing.replacePolicy(proof(request), body);
  }
  @Post('assessments') @HttpCode(200) @AccessEntry('staff') @HttpContract()
  assess(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: AssessmentDto): Promise<AssessmentView> {
    return this.billing.assess(proof(request), body);
  }
  @Post('bills') @AccessEntry('staff') @HttpContract()
  async settle(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: SettlementDto,
    @Res({ passthrough: true }) reply: { header(name: string, value: string): unknown }): Promise<BillView> {
    const bill = await this.billing.settle(proof(request), body);
    reply.header('Location', `/api/v1/billing/orders/${bill.orderId}/bill`);
    return bill;
  }
  @Get('orders/:orderId/bill') @AccessEntry('staff') @HttpContract()
  get(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: BillParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto): Promise<BillView> {
    return this.billing.get(proof(request), params.orderId);
  }
}
