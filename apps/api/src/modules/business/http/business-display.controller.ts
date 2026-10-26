import { Body, Controller, Get, Put, Query, Req, UseFilters } from '@nestjs/common';
import { AccessEntry, proof, type AccessRequest } from '../../authentication/http/public.js';
import { HttpContract } from '../../../infrastructure/http/http-contract.decorator.js';
import { DtoValidationPipe } from '../../../infrastructure/http/dto-validation.pipe.js';
import { EmptyQueryDto } from '../../../infrastructure/http/empty-query.dto.js';
import type { DisplayView } from '../application/display-settings.js';
import { BusinessDisplayService } from '../application/business-display.service.js';
import { DisplayReplacementDto } from './display-input.dto.js';
import { DisplayExceptionFilter } from './display-exception.filter.js';
@Controller('api/v1/business/display-settings')
@UseFilters(DisplayExceptionFilter)
export class BusinessDisplayController {
  constructor(private readonly display: BusinessDisplayService) {}
  @Get() @AccessEntry('staff') @HttpContract()
  read(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto): Promise<DisplayView> {
    return this.display.read(proof(request));
  }
  @Put() @AccessEntry('administrator') @HttpContract()
  update(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: DisplayReplacementDto): Promise<DisplayView> {
    return this.display.update(proof(request), body);
  }
}
