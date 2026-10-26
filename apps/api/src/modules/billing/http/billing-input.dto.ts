import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsDefined, IsIn, IsInt, IsObject, IsString, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONEY = /^(?:0|[1-9][0-9]{0,23})$/;
const RATE = /^(?:0|[1-9][0-9]?|100)(?:\.[0-9]{0,3}[1-9])?$/;
export class AssessmentDto {
  @IsString() @Matches(UUID) declare orderId: string;
  @IsArray() @ArrayMaxSize(8) @ArrayUnique() @IsString({ each: true }) @Matches(UUID, { each: true }) declare optionalChargeIds: string[];
}
export class SettlementDto extends AssessmentDto {
  @IsString() @Matches(UUID) declare retryKey: string;
  @IsString() @Matches(/^[A-Z]{3}$/) declare expectedCurrencyCode: string;
  @IsInt() @Min(0) @Max(4) declare expectedScale: number;
  @IsString() @Matches(/^[1-9][0-9]{0,23}$/) declare expectedPayableMinor: string;
  @IsInt() @Min(0) @Max(2_147_483_647) declare expectedPolicyRevision: number;
  @IsInt() @Min(0) @Max(2_147_483_647) declare expectedDisplayRevision: number;
}
export class BillParamsDto { @IsString() @Matches(UUID) declare orderId: string; }
export class ChargeRuleDto {
  @IsString() @Matches(UUID) declare id: string;
  @IsBoolean() declare enabled: boolean;
  @IsString() @MaxLength(160) declare label: string;
  @IsIn(['automatic', 'optional']) declare application: 'automatic' | 'optional';
  @IsIn(['fixed', 'percentage']) declare kind: 'fixed' | 'percentage';
  @ValidateIf((_o: unknown, value: unknown) => value !== null) @IsString() @Matches(MONEY) declare fixedMinor: string | null;
  @ValidateIf((_o: unknown, value: unknown) => value !== null) @IsString() @Matches(RATE) declare ratePercent: string | null;
}
export class TaxTargetsDto {
  @IsBoolean() declare merchandise: boolean;
  @IsArray() @ArrayMaxSize(8) @ArrayUnique() @IsString({ each: true }) @Matches(UUID, { each: true }) declare chargeIds: string[];
}
export class TaxRuleDto {
  @IsString() @Matches(UUID) declare id: string;
  @IsBoolean() declare enabled: boolean;
  @IsString() @MaxLength(160) declare label: string;
  @IsString() @Matches(RATE) declare ratePercent: string;
  @IsIn(['inclusive', 'exclusive']) declare priceMode: 'inclusive' | 'exclusive';
  @IsDefined() @IsObject() @ValidateNested() @Type(() => TaxTargetsDto) declare targets: TaxTargetsDto;
}
export class PolicyReplacementDto {
  @IsInt() @Min(0) @Max(2_147_483_647) declare expectedRevision: number;
  @IsIn(['unconfigured', 'configured']) declare status: 'unconfigured' | 'configured';
  @ValidateIf((_o: unknown, value: unknown) => value !== null) @IsString() @Matches(/^[A-Z]{3}$/) declare currencyCode: string | null;
  @ValidateIf((_o: unknown, value: unknown) => value !== null) @IsInt() @Min(0) @Max(4) declare scale: number | null;
  @IsIn(['halfUp', 'halfEven']) declare rounding: 'halfUp' | 'halfEven';
  @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => ChargeRuleDto) declare charges: ChargeRuleDto[];
  @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => TaxRuleDto) declare taxes: TaxRuleDto[];
  @IsString() @MaxLength(1000) declare configurationNote: string;
}
