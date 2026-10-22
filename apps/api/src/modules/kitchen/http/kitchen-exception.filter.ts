import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { KitchenError, type KitchenErrorCode } from '../domain/preparation.js';
interface Reply { header(name: string, value: string): Reply; status(value: number): Reply; send(value: unknown): void }
const statuses: Record<KitchenErrorCode, 400 | 404 | 409 | 503> = {
  INVALID_KITCHEN_INPUT: 400, TICKET_NOT_FOUND: 404, ORDER_NOT_FOUND: 404, STALE_TICKET: 409, TICKET_CAPACITY: 409, KITCHEN_UNAVAILABLE: 503,
};
@Catch(KitchenError)
export class KitchenExceptionFilter implements ExceptionFilter {
  catch(error: KitchenError, host: ArgumentsHost) {
    const status = statuses[error.code] ?? 503;
    host.switchToHttp().getResponse<Reply>().header('Cache-Control', 'no-store').status(status)
      .send({ statusCode: status, code: error.code, ...(error.code === 'STALE_TICKET' && error.current ? { current: error.current } : {}) });
  }
}
