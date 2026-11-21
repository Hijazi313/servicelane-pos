import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, ValidateIf, ValidateNested } from 'class-validator';

class ResolveChoiceDto {
  @IsString() declare groupId: string;
  @IsArray() @ArrayMaxSize(32) @IsString({ each: true }) declare optionIds: string[];
}

export class ResolveSelectionDto {
  @IsString() declare offeringId: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString() declare variantId?: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined && value !== null)
  @IsArray() @ArrayMaxSize(256) @IsString({ each: true }) declare addOnIds?: string[] | null;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined && value !== null)
  @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => ResolveChoiceDto)
  declare choices?: ResolveChoiceDto[] | null;
}
