import { createHmac, timingSafeEqual } from 'node:crypto';
import { OrdersError } from '../domain/capture.js';
import type { OrderPosition } from './order-store.js';

export class OrderListCursor {
  constructor(private readonly key: Buffer) {}
  private sign(value: string): Buffer { return createHmac('sha256', this.key).update(value).digest(); }
  private binding(businessId: string, branchId: string, limit: number): string {
    return this.sign(JSON.stringify([businessId, branchId, limit, 'created-desc-v1'])).toString('base64url');
  }
  issue(position: OrderPosition, businessId: string, branchId: string, limit: number): string {
    const payload = Buffer.from(JSON.stringify({ createdAt: position.createdAt, id: position.id, scope: this.binding(businessId, branchId, limit) })).toString('base64url');
    return `${payload}.${this.sign(payload).toString('base64url')}`;
  }
  read(token: string, businessId: string, branchId: string, limit: number): OrderPosition {
    try {
      if (token.length > 512 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) throw new Error();
      const [payload, signature] = token.split('.');
      if (!payload || !signature) throw new Error();
      const supplied = Buffer.from(signature, 'base64url');
      const expected = this.sign(payload);
      if (supplied.toString('base64url') !== signature || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error();
      const value: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (typeof value !== 'object' || value === null || Array.isArray(value) || Object.keys(value).length !== 3 || !('createdAt' in value) || typeof value.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt) || !('id' in value) || typeof value.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value.id) || !('scope' in value) || value.scope !== this.binding(businessId, branchId, limit)) throw new Error();
      return { createdAt: value.createdAt, id: value.id };
    } catch { throw new OrdersError('INVALID_ORDER_CURSOR'); }
  }
}
