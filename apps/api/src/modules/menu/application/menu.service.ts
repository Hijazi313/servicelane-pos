import { Injectable } from '@nestjs/common';
import { REQUEST_BODY_LIMIT_BYTES } from '../../../infrastructure/request-limits.js';
import type { InstallationContext } from '../../business/public.js';
import type { AuthorizedScope } from '../../authentication/public.js';
import { MenuStore } from './menu-store.js';
import { MenuError, activeView, definition, id, integer, object, precision, resolveSelection, validateReferences, type Offering, minor } from '../domain/catalogue.js';

export interface OrderSelection {
  offeringId: string; variantId?: string; addOnIds: string[];
  choices: { groupId: string; optionIds: string[] }[];
}
export interface ResolvedOrderUnit {
  offeringId: string; name: string; revision: number; currencyCode: string; scale: number; unitMinor: string;
  components: { itemId: string; itemName: string; variantId: string; variantName: string; quantity: number }[];
  addOns: { id: string; name: string; surcharge: string }[];
  choices: { groupId: string; optionId: string; name: string; surcharge: string }[];
}

const MAX_EDIT_REVISION = 2147483646;

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
      revision = integer(input.expectedRevision, 1, MAX_EDIT_REVISION);
      if (previous.revision !== revision) throw new MenuError(409, 'Stale offering revision');
    } else if (catalogue.length >= 500) throw new MenuError(409, 'Catalogue capacity reached');
    const offering = definition(input.definition, scope.installation.business.currencyCode, previous);
    validateReferences(offering, catalogue);
    // Reserve a full-width edit revision; root response metadata is not writable.
    const { id: _id, revision: _revision, currencyCode: _currency, scale: _scale, ...editable } = offering;
    const futureEdit = { definition: editable, expectedRevision: MAX_EDIT_REVISION };
    if (Buffer.byteLength(JSON.stringify(futureEdit), 'utf8') > REQUEST_BODY_LIMIT_BYTES) {
      throw new MenuError(400, 'Definition exceeds editable size limit');
    }
    await this.store.save(scope.installation.businessId, offering, revision, scope.transaction);
    return offering;
  }
  async deactivate(scope: AuthorizedScope, value: unknown, body: unknown) {
    const offeringId = id(value), input = object(body, ['expectedRevision']);
    const revision = integer(input.expectedRevision, 1, MAX_EDIT_REVISION);
    const catalogue = await this.snapshot(scope.installation, scope.transaction);
    const previous = catalogue.find(row => row.id === offeringId);
    if (!previous) throw new MenuError(404, 'Resource not found');
    if (previous.revision !== revision) throw new MenuError(409, 'Stale offering revision');
    // Deactivation remains possible when dependencies have already become unavailable.
    const offering = { ...previous, active: false, revision: revision + 1 };
    await this.store.save(scope.installation.businessId, offering, revision, scope.transaction);
    return offering;
  }
  async resolveOrderUnits(scope: AuthorizedScope, selections: readonly OrderSelection[]): Promise<ResolvedOrderUnit[]> {
    const catalogue = await this.snapshot(scope.installation, scope.transaction);
    return selections.map(selection => {
      const resolved = resolveSelection({ offeringId: selection.offeringId,
        ...(selection.variantId === undefined ? {} : { variantId: selection.variantId }),
        addOnIds: selection.addOnIds, ...(selection.choices.length ? { choices: selection.choices } : {}),
      }, catalogue);
      return { offeringId: resolved.offeringId, name: resolved.name, revision: resolved.revision,
        currencyCode: resolved.currencyCode, scale: resolved.scale, unitMinor: minor(resolved.total, resolved.scale).toString(),
        components: resolved.components.map(row => ({ ...row })),
        addOns: resolved.addOns.map(row => ({ id: row.id, name: row.name, surcharge: row.surcharge })),
        choices: resolved.choices.map(row => ({ ...row })),
      };
    });
  }
  async resolve(scope: AuthorizedScope, value: unknown) {
    return resolveSelection(value, await this.snapshot(scope.installation, scope.transaction));
  }
}
