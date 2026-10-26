import { Injectable } from '@nestjs/common';
import type { AuthorizedScope } from '../../authentication/public.js';
import { OrderStore } from './order-store.js';
import { supportedOrderCurrency } from '../domain/order-currency.js';

export interface OrderFinancial {
  orderId: string; capturedAt: string; fulfillment: 'takeaway'; currencyCode: string; scale: number; merchandiseMinor: string;
  lines: {
    position: number; quantity: number; unitMerchandiseMinor: string; merchandiseMinor: string;
    sellingUnit: {
      offeringId: string; name: string;
      components: { itemId: string; itemName: string; variantId: string; variantName: string; quantity: number }[];
      addOns: { id: string; name: string }[];
      choices: { groupId: string; optionId: string; name: string }[];
    };
  }[];
}
function amount(value: string): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,23})$/.test(value)) throw new Error('Order financial history unavailable');
  return BigInt(value);
}
function text(value: string): string {
  if (typeof value !== 'string' || !value || /[\p{Cc}\p{Cs}]/u.test(value)) throw new Error('Order financial history unavailable');
  return value;
}
// Caller already holds the current authorization transaction; no Menu resolution or writes.
@Injectable()
export class OrderFinancialService {
  constructor(private readonly store: OrderStore) {}
  async get(scope: AuthorizedScope, orderId: string): Promise<OrderFinancial | undefined> {
    const { businessId, branchId } = scope.installation;
    const saved = await this.store.get(businessId, branchId, orderId, scope.transaction);
    if (!saved) return undefined;
    if (saved.id !== orderId || saved.state !== 'captured' || saved.fulfillment !== 'takeaway' || saved.amountKind !== 'merchandise'
      || typeof saved.createdAt !== 'string' || !Number.isFinite(Date.parse(saved.createdAt))
      || new Date(saved.createdAt).toISOString() !== saved.createdAt || !supportedOrderCurrency(saved.currencyCode, saved.scale)
      || !Array.isArray(saved.lines) || saved.lines.length < 1 || saved.lines.length > 500) throw new Error('Order financial history unavailable');
    let total = 0n;
    const lines = saved.lines.map((line, position) => {
      if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 1000
        || line.unit.currencyCode !== saved.currencyCode || line.unit.scale !== saved.scale) throw new Error('Order financial history unavailable');
      const unit = amount(line.unit.unitMinor), merchandise = amount(line.lineMinor);
      if (unit * BigInt(line.quantity) !== merchandise) throw new Error('Order financial history unavailable');
      total += merchandise;
      if (!Array.isArray(line.unit.components) || !line.unit.components.length) throw new Error('Order financial history unavailable');
      return { position, quantity: line.quantity, unitMerchandiseMinor: unit.toString(), merchandiseMinor: merchandise.toString(),
        sellingUnit: { offeringId: text(line.unit.offeringId), name: text(line.unit.name),
          components: line.unit.components.map(component => {
            if (!Number.isSafeInteger(component.quantity) || component.quantity < 1) throw new Error('Order financial history unavailable');
            return { itemId: text(component.itemId), itemName: text(component.itemName), variantId: text(component.variantId),
              variantName: text(component.variantName), quantity: component.quantity };
          }),
          addOns: line.unit.addOns.map(extra => ({ id: text(extra.id), name: text(extra.name) })),
          choices: line.unit.choices.map(choice => ({ groupId: text(choice.groupId), optionId: text(choice.optionId), name: text(choice.name) })),
        } };
    });
    if (total !== amount(saved.totalMinor)) throw new Error('Order financial history unavailable');
    return { orderId: saved.id, capturedAt: saved.createdAt, fulfillment: saved.fulfillment, currencyCode: saved.currencyCode,
      scale: saved.scale, merchandiseMinor: total.toString(), lines };
  }
}
