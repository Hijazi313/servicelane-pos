import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { MAX_LINES, MAX_QUANTITY } from "../domain/capture.js";

class OrderChoiceDto {
  @IsString() declare groupId: string;
  @IsArray()
  @ArrayMaxSize(32)
  @IsString({ each: true })
  declare optionIds: string[];
}
class OrderSelectionDto {
  @IsString() declare offeringId: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  declare variantId?: string;
  // Existing Menu normalization accepts null/omission as an empty selection.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(256)
  @IsString({ each: true })
  declare addOnIds?: string[] | null;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => OrderChoiceDto)
  declare choices?: OrderChoiceDto[] | null;
}
class OrderLineDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OrderSelectionDto)
  declare selection: OrderSelectionDto;
  @IsInt() @Min(1) @Max(MAX_QUANTITY) declare quantity: number;
  @IsString()
  @Matches(/^(0|[1-9][0-9]{0,23})$/)
  declare expectedUnitMinor: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  declare instructions?: string;
}
class OrderCustomerDto {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  declare name?: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  declare phone?: string;
}
export class CreateOrderDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{16,128}$/) declare retryKey: string;
  @IsString() @Matches(/^[A-Z]{3}$/) declare currencyCode: string;
  @IsInt() @Min(0) @Max(4) declare scale: number;
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  declare lines: OrderLineDto[];
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => OrderCustomerDto)
  declare customer?: OrderCustomerDto;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  declare instructions?: string;
}
