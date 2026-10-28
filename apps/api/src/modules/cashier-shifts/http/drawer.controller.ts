import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, Res, UseFilters } from '@nestjs/common';
import { AccessEntry, proof, type AccessRequest } from '../../authentication/http/public.js';
import { HttpContract } from '../../../infrastructure/http/http-contract.decorator.js';
import { DtoValidationPipe } from '../../../infrastructure/http/dto-validation.pipe.js';
import { EmptyQueryDto } from '../../../infrastructure/http/empty-query.dto.js';
import { DrawerService } from '../application/drawer.service.js';
import { BeginHandoverDto, CountDto, CreateDrawerDto, DrawerParamsDto, DrawerPolicyDto, HandoverParamsDto,
  MovementDto, OpenDrawerDto, RevisionRetryDto, SessionParamsDto } from './drawer-input.dto.js';
import { DrawerExceptionFilter } from './drawer-exception.filter.js';

@Controller('api/v1')
@UseFilters(DrawerExceptionFilter)
export class DrawerController {
  constructor(private readonly drawers: DrawerService) {}

  // No known-drawer GET exists in this bounded interface, so creation is an action response.
  @Post('cash-drawers') @HttpCode(200) @AccessEntry('administrator') @HttpContract()
  create(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: CreateDrawerDto) {
    return this.drawers.createDrawer(proof(request), body);
  }
  @Get('cash-drawers') @AccessEntry('staff') @HttpContract()
  list(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto) {
    return this.drawers.listDrawers(proof(request));
  }
  @Post('cash-drawers/:drawerId/sessions') @AccessEntry('staff') @HttpContract()
  async open(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: DrawerParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto, @Body(new DtoValidationPipe()) body: OpenDrawerDto,
    @Res({ passthrough: true }) reply: { header(name: string, value: string): unknown }) {
    const session = await this.drawers.open(proof(request), params.drawerId, body);
    reply.header('Location', `/api/v1/cash-drawer-sessions/${session.id}`);
    return session;
  }
  @Get('cash-drawer-sessions/current') @AccessEntry('staff') @HttpContract()
  current(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto) {
    return this.drawers.current(proof(request));
  }
  @Get('cash-drawer-sessions/:sessionId') @AccessEntry('staff') @HttpContract()
  get(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: SessionParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto) {
    return this.drawers.get(proof(request), params.sessionId);
  }
  @Post('cash-drawer-sessions/:sessionId/movements') @HttpCode(200) @AccessEntry('staff') @HttpContract()
  move(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: SessionParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto, @Body(new DtoValidationPipe()) body: MovementDto) {
    return this.drawers.move(proof(request), params.sessionId, body);
  }
  @Post('cash-drawer-sessions/:sessionId/handovers') @HttpCode(200) @AccessEntry('staff') @HttpContract()
  begin(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: SessionParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto, @Body(new DtoValidationPipe()) body: BeginHandoverDto) {
    return this.drawers.beginHandover(proof(request), params.sessionId, body);
  }
  @Post('cash-drawer-sessions/:sessionId/handovers/:handoverId/accept') @HttpCode(200) @AccessEntry('staff') @HttpContract()
  accept(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: HandoverParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto, @Body(new DtoValidationPipe()) body: CountDto) {
    return this.drawers.acceptHandover(proof(request), params.sessionId, params.handoverId, body);
  }
  @Post('cash-drawer-sessions/:sessionId/handovers/:handoverId/cancel') @HttpCode(200) @AccessEntry('staff') @HttpContract()
  cancel(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: HandoverParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto, @Body(new DtoValidationPipe()) body: RevisionRetryDto) {
    return this.drawers.cancelHandover(proof(request), params.sessionId, params.handoverId, body);
  }
  @Post('cash-drawer-sessions/:sessionId/close') @HttpCode(200) @AccessEntry('staff') @HttpContract()
  close(@Req() request: AccessRequest, @Param(new DtoValidationPipe('path')) params: SessionParamsDto,
    @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto, @Body(new DtoValidationPipe()) body: CountDto) {
    return this.drawers.close(proof(request), params.sessionId, body);
  }
  @Get('cash-drawer-policy') @AccessEntry('staff') @HttpContract()
  policy(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto) {
    return this.drawers.getPolicy(proof(request));
  }
  @Put('cash-drawer-policy') @AccessEntry('administrator') @HttpContract()
  replacePolicy(@Req() request: AccessRequest, @Query(new DtoValidationPipe('query')) _query: EmptyQueryDto,
    @Body(new DtoValidationPipe()) body: DrawerPolicyDto) {
    return this.drawers.replacePolicy(proof(request), body);
  }
}
