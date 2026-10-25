import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { usesHttpContract } from './http-contract.decorator.js';

export interface ApiResponse<T> { data: T; meta: { requestId: string } }
/** Explicit page result; never infer pagination from arbitrary object properties. */
export class HttpPage<T> {
  constructor(readonly items: readonly T[], readonly nextCursor: string | null) {}
}
interface Request { id: string }
interface Reply { statusCode: number }

/** Normal JSON routes only. Field selection remains the controller's contract. */
@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => {
      const reply = context.switchToHttp().getResponse<Reply>();
      if (!usesHttpContract(context) || reply.statusCode === 204) return data;
      const requestId = context.switchToHttp().getRequest<Request>().id;
      if (data instanceof HttpPage) return { data: data.items, meta: { requestId, page: { nextCursor: data.nextCursor } } };
      return { data, meta: { requestId } };
    }));
  }
}
