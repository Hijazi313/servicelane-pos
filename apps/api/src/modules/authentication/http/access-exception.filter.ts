import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { AccessError } from '../application/access-policy.js';
import { type AccessReply } from './access-http.helpers.js';

@Catch()
export class AccessExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<AccessReply>();
    if (error instanceof AccessError) {
      if (error.retryAfter) reply.header('Retry-After', String(error.retryAfter));
      reply.header('Cache-Control', 'no-store').status(error.status).send({ statusCode: error.status, message: error.message });
      return;
    }
    // Preserve the accepted technical health failure contract without forwarding arbitrary errors.
    if (error instanceof HttpException && error.getStatus() === 503) {
      const body = error.getResponse();
      if (typeof body === 'object' && body !== null && Object.keys(body).length === 1 && 'status' in body && body.status === 'unavailable') {
        reply.status(503).send({ status: 'unavailable' }); return;
      }
    }
    const status = error instanceof HttpException ? error.getStatus() : 503;
    const message = status === 404 ? 'Resource not found' : status === 400 ? 'Invalid input' : status === 413 ? 'Request too large' : 'Service unavailable';
    reply.header('Cache-Control', 'no-store').status(status).send({ statusCode: status, message });
  }
}
