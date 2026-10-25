import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccessService, type Proof } from '../../authentication/public.js';
import { MenuOrderResolver } from '../../menu/public.js';
import { OrderStore, type OrderSnapshot } from './order-store.js';
import { parseOrderCapture } from './parse-order-capture.js';
import { canonical, OrdersError, MAX_LINES, MAX_QUANTITY, RESPONSE_BYTES, object, integer, identifier, checkedAmount } from '../domain/capture.js';

export function snapshotFits(snapshot: OrderSnapshot): boolean {
  return Buffer.byteLength(JSON.stringify(snapshot), 'utf8') <= RESPONSE_BYTES;
}
@Injectable()
export class OrdersService {
  constructor(private readonly access: AccessService, private readonly menu: MenuOrderResolver, private readonly store: OrderStore) {}
  async create(proof: Proof, value: unknown): Promise<OrderSnapshot> {
    const { key, request } = parseOrderCapture(value, selection => this.menu.normalize(selection));
    return this.access.runAuthorized(proof, 'staff', async scope => {
      const { businessId, branchId } = scope.installation;
      const existing = await this.store.replay(businessId, branchId, key, scope.transaction);
      if (existing) {
        if (canonical(existing.request) !== canonical(request)) throw new OrdersError('RETRY_CONTENT_CONFLICT');
        return existing.snapshot;
      }
      const policy = await this.store.policy(businessId, scope.transaction);
      if (request.lines.length > policy.maxLines || request.lines.some(line => line.quantity > policy.maxQuantity)) throw new OrdersError('ORDER_LIMIT_EXCEEDED');
      const units = await this.menu.resolve(scope, request.lines.map(line => line.selection));
      const first = units[0];
      if (!first || units.length !== request.lines.length) throw new OrdersError('MENU_RESULT_UNAVAILABLE');
      const changed = units.flatMap((unit, index) => unit.unitMinor !== request.lines[index]?.expectedUnitMinor || unit.currencyCode !== request.currencyCode || unit.scale !== request.scale
        ? [{ line: index, unitMinor: unit.unitMinor }] : []);
      if (changed.length) throw new OrdersError('PRICE_CONFIRMATION_REQUIRED', { currencyCode: first.currencyCode, scale: first.scale, lines: changed });
      let total = 0n;
      const lines = request.lines.map((line, index) => {
        const unit = units[index];
        if (!unit) throw new OrdersError('MENU_RESULT_UNAVAILABLE');
        const amount = BigInt(unit.unitMinor) * BigInt(line.quantity); total += amount;
        return { selection: line.selection, quantity: line.quantity, ...(line.instructions ? { instructions: line.instructions } : {}), unit, lineMinor: checkedAmount(amount) };
      });
      const snapshot: OrderSnapshot = { id: randomUUID(), createdAt: new Date().toISOString(), state: 'captured', fulfillment: 'takeaway', amountKind: 'merchandise',
        currencyCode: first.currencyCode, scale: first.scale, totalMinor: checkedAmount(total), policy,
        ...(request.customer ? { customer: request.customer } : {}), ...(request.instructions ? { instructions: request.instructions } : {}), lines };
      if (!snapshotFits(snapshot)) throw new OrdersError('ORDER_RESPONSE_CAPACITY');
      await this.store.save(businessId, branchId, key, { snapshot, request }, scope.transaction);
      return snapshot;
    });
  }
  private async context(proof: Proof) {
    const context = await this.access.me(proof, true);
    if (!('business' in context)) throw new OrdersError('INSTALLATION_UNAVAILABLE');
    return context;
  }
  async get(proof: Proof, value: unknown): Promise<OrderSnapshot> {
    const orderId = identifier(value), context = await this.context(proof);
    const snapshot = await this.store.get(context.businessId, context.branchId, orderId);
    if (!snapshot) throw new OrdersError('ORDER_NOT_FOUND');
    return snapshot;
  }
  async policy(proof: Proof) { return this.store.policy((await this.context(proof)).businessId); }
  async updatePolicy(proof: Proof, value: unknown) {
    const input = object(value, ['maxLines', 'maxQuantity', 'expectedRevision']);
    const expected = integer(input.expectedRevision, 0, 2147483646);
    const policy = { maxLines: integer(input.maxLines, 1, MAX_LINES), maxQuantity: integer(input.maxQuantity, 1, MAX_QUANTITY), revision: expected + 1 };
    return this.access.runAuthorized(proof, 'administrator', async scope => {
      await this.store.updatePolicy(scope.installation.businessId, policy, expected, scope.transaction);
      return policy;
    });
  }
}
