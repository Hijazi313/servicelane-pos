import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { MenuError } from '../../menu/public.js';
import { menuErrorStatus } from '../../menu/http/public.js';
import { OrdersError, type OrdersErrorCode } from '../domain/capture.js';
interface Reply { header(name: string, value: string): Reply; status(value: number): Reply; send(value: unknown): void }
const statuses: Record<OrdersErrorCode, 400 | 404 | 409 | 503> = {
  INVALID_ORDER_INPUT: 400, INVALID_RETRY_KEY: 400, INVALID_CURRENCY: 400, INVALID_LINES: 400, ORDER_LIMIT_EXCEEDED: 400,
  ORDER_NOT_FOUND: 404,
  ORDER_AMOUNT_CAPACITY: 409, RETRY_CONTENT_CONFLICT: 409, PRICE_CONFIRMATION_REQUIRED: 409, ORDER_RESPONSE_CAPACITY: 409, STALE_ORDER_POLICY: 409,
  MENU_RESULT_UNAVAILABLE: 503, INSTALLATION_UNAVAILABLE: 503,
};
@Catch(OrdersError, MenuError)
export class OrdersExceptionFilter implements ExceptionFilter {
  catch(error: OrdersError | MenuError, host: ArgumentsHost) {
    const status = error instanceof OrdersError ? statuses[error.code] ?? 503 : menuErrorStatus(error.reason);
    const body = error instanceof OrdersError ? { statusCode: status, code: error.code, ...(error.details ? { details: error.details } : {}) }
      : { statusCode: status, code: status === 400 ? 'INVALID_MENU_SELECTION' : status === 404 ? 'MENU_OFFERING_NOT_FOUND' : status === 409 ? 'MENU_SELECTION_CONFLICT' : 'MENU_UNAVAILABLE' };
    host.switchToHttp().getResponse<Reply>().header('Cache-Control', 'no-store').status(status).send(body);
  }
}
