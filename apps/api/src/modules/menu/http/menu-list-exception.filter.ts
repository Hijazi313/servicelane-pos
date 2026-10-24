import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { MenuError } from '../domain/catalogue.js';
import { menuErrorStatus } from './menu-error-mapping.js';
import { writeProblemDetails, type ProblemReply } from '../../../infrastructure/http/problem-details.js';
import { httpProblem } from '../../../infrastructure/http/http-error-policy.js';

/** Bound only to the migrated active-list endpoint. */
@Catch(MenuError)
export class MenuListExceptionFilter implements ExceptionFilter {
  catch(error: MenuError, host: ArgumentsHost): void {
    writeProblemDetails(host.switchToHttp().getResponse<ProblemReply>(),
      host.switchToHttp().getRequest<{ id: string }>().id,
      httpProblem(menuErrorStatus(error.reason), `MENU_${error.reason}`));
  }
}
