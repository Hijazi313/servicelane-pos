import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class ListOrdersDto {
  @IsString() @Matches(/^(?:[1-9]|[1-9][0-9]|100)$/)
  limit = '50';
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString() @MaxLength(1024)
  declare cursor?: string;
}
