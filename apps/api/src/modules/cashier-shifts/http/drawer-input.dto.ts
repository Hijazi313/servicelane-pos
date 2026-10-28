import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsInt, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONEY = /^(?:0|[1-9][0-9]{0,23})$/;
const POSITIVE_MONEY = /^[1-9][0-9]{0,23}$/;

export class DrawerParamsDto { @IsString() @Matches(UUID) declare drawerId: string; }
export class SessionParamsDto { @IsString() @Matches(UUID) declare sessionId: string; }
export class HandoverParamsDto extends SessionParamsDto { @IsString() @Matches(UUID) declare handoverId: string; }
export class RetryDto { @IsString() @Matches(UUID) declare retryKey: string; }
export class RevisionRetryDto extends RetryDto { @IsInt() @Min(0) @Max(2_147_483_647) declare expectedRevision: number; }
export class CreateDrawerDto extends RetryDto { @IsString() @MaxLength(240) declare label: string; }
export class OpenDrawerDto extends RetryDto { @IsString() @Matches(MONEY) declare openingMinor: string; }
export class MovementDto extends RevisionRetryDto {
  @IsIn(['in', 'out']) declare direction: 'in' | 'out';
  @IsString() @Matches(POSITIVE_MONEY) declare amountMinor: string;
  @IsString() @MaxLength(1000) declare reason: string;
}
export class BeginHandoverDto extends RevisionRetryDto { @IsString() @Matches(UUID) declare recipientStaffId: string; }
export class CountDto extends RevisionRetryDto {
  @IsString() @Matches(MONEY) declare countedMinor: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== null) @IsString() @MaxLength(1000) declare varianceReason: string | null;
}
export class DrawerPolicyDto {
  @IsBoolean() declare selfClose: boolean;
  @IsBoolean() declare replacementClose: boolean;
  @IsArray() @ArrayMaxSize(100) @ArrayUnique() @IsString({ each: true }) @Matches(UUID, { each: true }) declare replacementStaffIds: string[];
  @IsInt() @Min(0) @Max(2_147_483_647) declare expectedRevision: number;
  @IsString() @MaxLength(1000) declare note: string;
}
