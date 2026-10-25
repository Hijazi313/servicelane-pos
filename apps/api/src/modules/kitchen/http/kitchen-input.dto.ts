import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export class DispatchTicketDto {
  @IsString() @Matches(UUID) declare orderId: string;
}
export class TicketParamsDto {
  @IsString() @Matches(UUID) declare id: string;
}
export class AdvanceTicketDto {
  @IsIn(['preparing', 'ready']) declare state: 'preparing' | 'ready';
  @IsInt() @Min(0) @Max(1) declare expectedRevision: number;
}
export class TicketQueueQueryDto {
  // Keep canonical decimal text for the existing application boundary parser.
  @IsString() @Matches(/^(?:[1-9]|[1-9][0-9]|100)$/)
  limit = '25';
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString() @MaxLength(1024)
  declare cursor?: string;
}
