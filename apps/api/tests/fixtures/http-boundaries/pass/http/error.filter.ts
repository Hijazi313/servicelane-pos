import { HttpException } from '@nestjs/common';
export class HttpFailure extends Error {
  constructor(readonly status: number) { super(); }
}
export const failure = new HttpException('Invalid input', 400);
