import { Injectable } from '@nestjs/common';
import type { AuthorizedScope } from '../../authentication/public.js';
import { DisplayStore, type DisplayScope } from './display-store.js';
import { displayReplacement, DisplaySettingsError, type DisplayView } from './display-settings.js';
@Injectable()
export class DisplaySettingsService {
  constructor(private readonly store: DisplayStore) {}
  get(scope: AuthorizedScope): Promise<DisplayView> { return this.store.get(scope.installation, scope.transaction); }
  read(scope: DisplayScope): Promise<DisplayView> { return this.store.get(scope); }
  async replace(scope: AuthorizedScope, input: unknown): Promise<DisplayView> {
    const replacement = displayReplacement(input), before = await this.get(scope);
    if (replacement.expectedRevision !== before.revision) throw new DisplaySettingsError('STALE_DISPLAY_SETTINGS', before.revision);
    if (before.businessName === replacement.businessName && before.branchName === replacement.branchName && before.branchAddress === replacement.branchAddress) return before;
    if (before.revision === 2147483647) throw new DisplaySettingsError('REVISION_CAPACITY');
    const after: DisplayView = { revision: before.revision + 1, businessName: replacement.businessName,
      branchName: replacement.branchName, branchAddress: replacement.branchAddress, currencyCode: before.currencyCode, timezone: before.timezone };
    if (Buffer.byteLength(JSON.stringify({ data: after, meta: { requestId: '00000000-0000-0000-0000-000000000000' } })) > 16384) throw new DisplaySettingsError('INVALID_DISPLAY_SETTINGS');
    await this.store.replace(scope.installation, before, after, scope.actorId, new Date(), scope.transaction);
    return after;
  }
}
