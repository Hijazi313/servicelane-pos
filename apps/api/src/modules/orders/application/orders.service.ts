import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccessService, type Proof } from '../../authentication/public.js';
import { MenuOrderResolver } from '../../menu/public.js';
import { OrderStore, type CaptureRequest, type OrderSnapshot } from './order-store.js';
import { canonical, OrdersError, MAX_LINES, MAX_QUANTITY, RESPONSE_BYTES, object, integer, identifier, optionalText, customer, minorAmount, checkedAmount } from '../domain/capture.js';

export function snapshotFits(snapshot: OrderSnapshot): boolean {
  return Buffer.byteLength(JSON.stringify(snapshot), 'utf8') <= RESPONSE_BYTES;
}
@Injectable()
export class OrdersService {
  constructor(private readonly access: AccessService, private readonly menu: MenuOrderResolver, private readonly store: OrderStore) {}
  private parse(value: unknown): { key: string; request: CaptureRequest } {
    const input = object(value, ['retryKey', 'currencyCode', 'scale', 'lines', 'customer', 'instructions']);
    if (typeof input.retryKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(input.retryKey)) throw new OrdersError(400, 'INVALID_RETRY_KEY');
    if (typeof input.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(input.currencyCode)) throw new OrdersError(400, 'INVALID_CURRENCY');
    const scale = integer(input.scale, 0, 4), rawLines = input.lines;
    if (!Array.isArray(rawLines) || !rawLines.length || rawLines.length > MAX_LINES) throw new OrdersError(400, 'INVALID_LINES');
    const lines = rawLines.map(value => {
      const row = object(value, ['selection', 'quantity', 'expectedUnitMinor', 'instructions']);
      const instructions = optionalText(row.instructions, 250);
      return { selection: this.menu.normalize(row.selection), quantity: integer(row.quantity, 1, MAX_QUANTITY),
        expectedUnitMinor: minorAmount(row.expectedUnitMinor), ...(instructions ? { instructions } : {}) };
    });
    const details = customer(input.customer), instructions = optionalText(input.instructions, 500);
    return { key: input.retryKey, request: { currencyCode: input.currencyCode, scale, lines,
      ...(details ? { customer: details } : {}), ...(instructions ? { instructions } : {}) } };
  }
  async create(proof: Proof, value: unknown): Promise<OrderSnapshot> {
    const { key, request } = this.parse(value);
    return this.access.runAuthorized(proof, 'staff', async scope => {
      const { businessId, branchId } = scope.installation;
      const existing = await this.store.replay(businessId, branchId, key, scope.transaction);
      if (existing) {
        if (canonical(existing.request) !== canonical(request)) throw new OrdersError(409, 'RETRY_CONTENT_CONFLICT');
        return existing.snapshot;
      }
      const policy = await this.store.policy(businessId, scope.transaction);
      if (request.lines.length > policy.maxLines || request.lines.some(line => line.quantity > policy.maxQuantity)) throw new OrdersError(400, 'ORDER_LIMIT_EXCEEDED');
      const units = await this.menu.resolve(scope, request.lines.map(line => line.selection));
      const first = units[0];
      if (!first || units.length !== request.lines.length) throw new OrdersError(503, 'MENU_RESULT_UNAVAILABLE');
      const changed = units.flatMap((unit, index) => unit.unitMinor !== request.lines[index]?.expectedUnitMinor || unit.currencyCode !== request.currencyCode || unit.scale !== request.scale
        ? [{ line: index, unitMinor: unit.unitMinor }] : []);
      if (changed.length) throw new OrdersError(409, 'PRICE_CONFIRMATION_REQUIRED', { currencyCode: first.currencyCode, scale: first.scale, lines: changed });
      let total = 0n;
      const lines = request.lines.map((line, index) => {
        const unit = units[index];
        if (!unit) throw new OrdersError(503, 'MENU_RESULT_UNAVAILABLE');
        const amount = BigInt(unit.unitMinor) * BigInt(line.quantity); total += amount;
        return { selection: line.selection, quantity: line.quantity, ...(line.instructions ? { instructions: line.instructions } : {}), unit, lineMinor: checkedAmount(amount) };
      });
      const snapshot: OrderSnapshot = { id: randomUUID(), createdAt: new Date().toISOString(), state: 'captured', fulfillment: 'takeaway', amountKind: 'merchandise',
        currencyCode: first.currencyCode, scale: first.scale, totalMinor: checkedAmount(total), policy,
        ...(request.customer ? { customer: request.customer } : {}), ...(request.instructions ? { instructions: request.instructions } : {}), lines };
      if (!snapshotFits(snapshot)) throw new OrdersError(409, 'ORDER_RESPONSE_CAPACITY');
      await this.store.save(businessId, branchId, key, { snapshot, request }, scope.transaction);
      return snapshot;
    });
  }
  private async context(proof: Proof) {
    const context = await this.access.me(proof, true);
    if (!('business' in context)) throw new OrdersError(503, 'INSTALLATION_UNAVAILABLE');
    return context;
  }
  async get(proof: Proof, value: unknown): Promise<OrderSnapshot> {
    const orderId = identifier(value), context = await this.context(proof);
    const snapshot = await this.store.get(context.businessId, context.branchId, orderId);
    if (!snapshot) throw new OrdersError(404, 'ORDER_NOT_FOUND');
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
