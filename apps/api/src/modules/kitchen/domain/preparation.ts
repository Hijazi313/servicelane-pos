export type TicketState = 'queued' | 'preparing' | 'ready';
export type KitchenErrorCode = 'INVALID_KITCHEN_INPUT' | 'TICKET_NOT_FOUND' | 'ORDER_NOT_FOUND' | 'STALE_TICKET' | 'TICKET_CAPACITY' | 'KITCHEN_UNAVAILABLE';
export class KitchenError extends Error {
  constructor(readonly code: KitchenErrorCode, readonly current?: { state: TicketState; revision: number }) { super(code); }
}
export const TICKET_RESPONSE_BYTES = 1_048_576;
export function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new KitchenError('INVALID_KITCHEN_INPUT');
  return Object.fromEntries(Object.entries(value));
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new KitchenError('INVALID_KITCHEN_INPUT');
  return value.toLowerCase();
}
export function transition(value: unknown): { target: 'preparing' | 'ready'; expectedRevision: number } {
  const row = object(value, ['state', 'expectedRevision']);
  if ((row.state !== 'preparing' && row.state !== 'ready') || (row.expectedRevision !== 0 && row.expectedRevision !== 1)) throw new KitchenError('INVALID_KITCHEN_INPUT');
  return { target: row.state, expectedRevision: row.expectedRevision };
}
const MAX_POSITION = 9_223_372_036_854_775_807n;
export function position(value: unknown): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,18})$/.test(value) || BigInt(value) > MAX_POSITION) throw new KitchenError('INVALID_KITCHEN_INPUT');
  return value;
}
export function queueRequest(value: unknown): { limit: number; after: string; fence?: string } {
  const row = object(value, ['limit', 'cursor']);
  const limit = row.limit === undefined ? 25 : typeof row.limit === 'string' && /^(?:[1-9]|[1-9][0-9]|100)$/.test(row.limit) ? Number(row.limit) : 0;
  if (!limit) throw new KitchenError('INVALID_KITCHEN_INPUT');
  if (row.cursor === undefined) return { limit, after: '0' };
  if (typeof row.cursor !== 'string' || row.cursor.length > 39) throw new KitchenError('INVALID_KITCHEN_INPUT');
  const parts = row.cursor.split(':');
  if (parts.length !== 2) throw new KitchenError('INVALID_KITCHEN_INPUT');
  const after = position(parts[0]), fence = position(parts[1]);
  if (BigInt(after) > BigInt(fence)) throw new KitchenError('INVALID_KITCHEN_INPUT');
  return { limit, after, fence };
}
