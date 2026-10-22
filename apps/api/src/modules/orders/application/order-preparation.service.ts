import { Injectable } from '@nestjs/common';
import type { AuthorizedScope } from '../../authentication/public.js';
import { OrderStore } from './order-store.js';

export interface OrderPreparation {
  orderId: string;
  capturedAt: string;
  fulfillment: 'takeaway';
  instructions?: string;
  lines: {
    position: number; quantity: number; offeringId: string; name: string; instructions?: string;
    components: { itemId: string; itemName: string; variantId: string; variantName: string; quantity: number }[];
    addOns: { id: string; name: string }[];
    choices: { groupId: string; optionId: string; name: string }[];
  }[];
}

// Caller supplies an active authorized transaction. No nested access or Menu resolution.
@Injectable()
export class OrderPreparationService {
  constructor(private readonly store: OrderStore) {}
  async get(scope: AuthorizedScope, orderId: string): Promise<OrderPreparation | undefined> {
    const { businessId, branchId } = scope.installation;
    const snapshot = await this.store.get(businessId, branchId, orderId, scope.transaction);
    if (!snapshot) return undefined;
    if (snapshot.id !== orderId || snapshot.state !== 'captured' || snapshot.fulfillment !== 'takeaway'
      || !Number.isFinite(Date.parse(snapshot.createdAt)) || !Array.isArray(snapshot.lines) || !snapshot.lines.length) {
      throw new Error('Order preparation unavailable');
    }
    return {
      orderId: snapshot.id, capturedAt: snapshot.createdAt, fulfillment: snapshot.fulfillment,
      ...(snapshot.instructions ? { instructions: snapshot.instructions } : {}),
      lines: snapshot.lines.map((line, position) => {
        if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || !line.unit.name || !line.unit.components.length) {
          throw new Error('Order preparation unavailable');
        }
        return {
          position, quantity: line.quantity, offeringId: line.unit.offeringId, name: line.unit.name,
          ...(line.instructions ? { instructions: line.instructions } : {}),
          components: line.unit.components.map(component => {
            if (!Number.isSafeInteger(component.quantity) || component.quantity < 1) throw new Error('Order preparation unavailable');
            return { itemId: component.itemId, itemName: component.itemName, variantId: component.variantId,
              variantName: component.variantName, quantity: component.quantity };
          }),
          addOns: line.unit.addOns.map(extra => ({ id: extra.id, name: extra.name })),
          choices: line.unit.choices.map(choice => ({ groupId: choice.groupId, optionId: choice.optionId, name: choice.name })),
        };
      }),
    };
  }
}
