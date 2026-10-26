import { IsInt, IsString, Max, Min, ValidateIf } from 'class-validator';
export class DisplayReplacementDto {
  @IsInt() @Min(0) @Max(2147483647) declare expectedRevision: number;
  @IsString() declare businessName: string;
  @IsString() declare branchName: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== null) @IsString() declare branchAddress: string | null;
}
