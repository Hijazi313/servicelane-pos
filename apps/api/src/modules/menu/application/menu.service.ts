import { Injectable } from '@nestjs/common';
import type { InstallationContext } from '../../business/public.js';
import type { AuthorizedScope } from '../../authentication/public.js';
import { MenuStore } from './menu-store.js';
import { MenuError, activeView, definition, id, integer, object, precision, resolveSelection, validateReferences, type Offering } from '../domain/catalogue.js';

@Injectable()
export class MenuService {
  constructor(private readonly store: MenuStore) {}
  private async snapshot(context: InstallationContext, transaction?: AuthorizedScope['transaction']) {
    const catalogue = await this.store.read(context.businessId, transaction);
    const scale = precision(context.business.currencyCode);
    if (catalogue.some(row => row.currencyCode !== context.business.currencyCode || row.scale !== scale)) throw new MenuError(409, 'Catalogue currency changed');
    return catalogue;
  }
  async list(context: InstallationContext, inactive = false) {
    const catalogue = await this.snapshot(context);
    return inactive ? catalogue : catalogue.flatMap(row => { const view = activeView(row, catalogue); return view ? [view] : []; });
  }
  async get(context: InstallationContext, value: unknown, inactive = false) {
    const offeringId = id(value), catalogue = await this.snapshot(context);
    const offering = catalogue.find(row => row.id === offeringId);
    const result = offering && (inactive ? offering : activeView(offering, catalogue));
    if (!result) throw new MenuError(404, 'Resource not found');
    return result;
  }
  async save(scope: AuthorizedScope, value: unknown, offeringId?: unknown) {
    const input = object(value, offeringId === undefined ? ['definition'] : ['definition', 'expectedRevision']);
    const catalogue = await this.snapshot(scope.installation, scope.transaction);
    let previous: Offering | undefined, revision: number | undefined;
    if (offeringId !== undefined) {
      const parsed = id(offeringId); previous = catalogue.find(row => row.id === parsed);
      if (!previous) throw new MenuError(404, 'Resource not found');
      revision = integer(input.expectedRevision, 1, 2147483646);
      if (previous.revision !== revision) throw new MenuError(409, 'Stale offering revision');
    } else if (catalogue.length >= 500) throw new MenuError(409, 'Catalogue capacity reached');
    const offering = definition(input.definition, scope.installation.business.currencyCode, previous);
    validateReferences(offering, catalogue);
    await this.store.save(scope.installation.businessId, offering, revision, scope.transaction);
    return offering;
  }
  async deactivate(scope: AuthorizedScope, value: unknown, body: unknown) {
    const offeringId = id(value), input = object(body, ['expectedRevision']);
    const revision = integer(input.expectedRevision, 1, 2147483646);
    const catalogue = await this.snapshot(scope.installation, scope.transaction);
    const previous = catalogue.find(row => row.id === offeringId);
    if (!previous) throw new MenuError(404, 'Resource not found');
    if (previous.revision !== revision) throw new MenuError(409, 'Stale offering revision');
    // Deactivation remains possible when dependencies have already become unavailable.
    const offering = { ...previous, active: false, revision: revision + 1 };
    await this.store.save(scope.installation.businessId, offering, revision, scope.transaction);
    return offering;
  }
  async resolve(scope: AuthorizedScope, value: unknown) {
    return resolveSelection(value, await this.snapshot(scope.installation, scope.transaction));
  }
}
