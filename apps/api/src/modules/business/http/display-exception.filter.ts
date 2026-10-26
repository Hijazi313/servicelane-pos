import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { HttpContractFilter } from '../../../infrastructure/http/http-contract.filter.js';
import { errorPolicy, httpProblem } from '../../../infrastructure/http/http-error-policy.js';
import { DisplaySettingsError, type DisplayErrorCode } from '../application/display-settings.js';
const statuses: Record<DisplayErrorCode, 400 | 409 | 503> = {
  INVALID_DISPLAY_SETTINGS: 400, STALE_DISPLAY_SETTINGS: 409, REVISION_CAPACITY: 409, DISPLAY_SETTINGS_UNAVAILABLE: 503,
};
@Catch(DisplaySettingsError)
export class DisplayExceptionFilter implements ExceptionFilter {
  catch(error: DisplaySettingsError, host: ArgumentsHost): void {
    new HttpContractFilter({ catch: () => { throw error; } }, errorPolicy(failure => {
      if (!(failure instanceof DisplaySettingsError)) return undefined;
      return { ...httpProblem(statuses[failure.code], failure.code),
        ...(failure.code === 'STALE_DISPLAY_SETTINGS' && failure.revision !== undefined ? { details: { revision: failure.revision } } : {}) };
    })).catch(error, host);
  }
}
