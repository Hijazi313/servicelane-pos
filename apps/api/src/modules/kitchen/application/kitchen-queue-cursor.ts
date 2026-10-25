import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { KitchenError, position } from '../domain/preparation.js';
import type { KitchenScope } from './kitchen-store.js';

interface Continuation { after: string; fence: string }

/** Tokens are navigation only. A new service/process key requires a fresh scan. */
export class KitchenQueueCursor {
  private readonly key = randomBytes(32);

  private signature(value: string): Buffer {
    return createHmac('sha256', this.key).update(value).digest();
  }

  private binding(scope: KitchenScope, limit: number): string {
    return this.signature(JSON.stringify([scope.businessId, scope.branchId, 'position-asc-v1', limit])).toString('base64url');
  }

  issue(continuation: Continuation, scope: KitchenScope, limit: number): string {
    const payload = Buffer.from(JSON.stringify({ v: 1, a: continuation.after, f: continuation.fence, s: this.binding(scope, limit) })).toString('base64url');
    return `${payload}.${this.signature(payload).toString('base64url')}`;
  }

  read(token: string, scope: KitchenScope, limit: number): Continuation {
    try {
      if (token.length > 512 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) throw new Error();
      const [payload, signature] = token.split('.');
      if (payload === undefined || signature === undefined) throw new Error();
      const supplied = Buffer.from(signature, 'base64url');
      const expected = this.signature(payload);
      if (supplied.toString('base64url') !== signature || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error();
      const decoded: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) throw new Error();
      if (!('v' in decoded) || decoded.v !== 1 || !('s' in decoded) || decoded.s !== this.binding(scope, limit)
        || !('a' in decoded) || !('f' in decoded) || Object.keys(decoded).length !== 4) throw new Error();
      const after = position(decoded.a), fence = position(decoded.f);
      if (BigInt(after) > BigInt(fence)) throw new Error();
      return { after, fence };
    } catch {
      throw new KitchenError('INVALID_KITCHEN_CURSOR');
    }
  }
}
