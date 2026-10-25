import { BadRequestException, ValidationPipe, type ArgumentMetadata } from '@nestjs/common';
import * as validator from 'class-validator';
import * as transformer from 'class-transformer';
import type { ValidationError } from 'class-validator';

export interface InputIssue { location: 'body' | 'query' | 'path'; field: string; code: string }
export class InputValidationError extends BadRequestException {
  constructor(readonly issues: readonly InputIssue[]) { super('Invalid input'); }
}
function pointer(value: string): string { return value.replaceAll('~', '~0').replaceAll('/', '~1'); }
function issues(errors: readonly ValidationError[], location: InputIssue['location'], parent = ''): InputIssue[] {
  return errors.flatMap(error => {
    const field = typeof error.property === 'string' ? `${parent}/${pointer(error.property)}` : parent;
    return [
      ...Object.keys(error.constraints ?? {}).map(code => ({ location, field, code: code.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase() })),
      ...issues(error.children ?? [], location, field),
    ];
  });
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function checkRaw(value: unknown, location: InputIssue['location'], field = ''): void {
  if (Array.isArray(value)) {
    value.forEach((child: unknown, index: number) => checkRaw(child, location, `${field}/${index}`));
    return;
  }
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    // class-transformer intentionally skips these; reject rather than silently drop.
    if (key === '__proto__' || key === 'constructor') {
      throw new InputValidationError([{ location, field: `${field}/${pointer(key)}`, code: 'WHITELIST_VALIDATION' }]);
    }
    checkRaw(value[key], location, `${field}/${pointer(key)}`);
  }
}

/** Route-bound DTO validation; does not change accepted legacy routes globally. */
export class DtoValidationPipe extends ValidationPipe {
  constructor(private readonly location: InputIssue['location'] = 'body') {
    super({
      validatorPackage: validator, transformerPackage: transformer,
      transform: true, transformOptions: { enableImplicitConversion: false },
      whitelist: true, forbidNonWhitelisted: true,
      // Body DTOs must have validation metadata. The intentionally empty query
      // DTO uses Nest's default false; unknown query keys still fail whitelist.
      forbidUnknownValues: location === 'body',
      validationError: { target: false, value: false },
      exceptionFactory: errors => new InputValidationError(issues(errors, location)),
    });
  }
  override async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new InputValidationError([{ location: this.location, field: '', code: 'IS_OBJECT' }]);
    }
    checkRaw(value, this.location);
    const result: unknown = await super.transform(value, metadata);
    return result;
  }
}
