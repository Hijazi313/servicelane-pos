import { BadRequestException, type PipeTransform } from '@nestjs/common';

/** Adapt a module-owned, independently callable parser to a Nest parameter. */
export class ValidatedInputPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly parse: (value: unknown) => T) {}
  transform(value: unknown): T { return this.parse(value); }
}

/** For contracts explicitly accepting no query parameters. */
export function parseEmptyQuery(value: unknown): Record<string, never> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || Object.keys(value).length) {
    throw new BadRequestException();
  }
  return {};
}
