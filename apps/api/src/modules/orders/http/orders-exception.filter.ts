import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { MenuError } from '../../menu/public.js';
import { OrdersError } from '../domain/capture.js';
interface Reply { header(name: string, value: string): Reply; status(value: number): Reply; send(value: unknown): void }
@Catch(OrdersError, MenuError)
export class OrdersExceptionFilter implements ExceptionFilter {
  catch(error: OrdersError | MenuError, host: ArgumentsHost) {
    const body = error instanceof OrdersError ? { statusCode: error.status, code: error.code, ...(error.details ? { details: error.details } : {}) }
      : { statusCode: error.status, code: error.status === 400 ? 'INVALID_MENU_SELECTION' : error.status === 404 ? 'MENU_OFFERING_NOT_FOUND' : error.status === 409 ? 'MENU_SELECTION_CONFLICT' : 'MENU_UNAVAILABLE' };
    host.switchToHttp().getResponse<Reply>().header('Cache-Control', 'no-store').status(error.status).send(body);
  }
}
