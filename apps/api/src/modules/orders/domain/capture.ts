export type OrdersErrorCode = 'INVALID_ORDER_INPUT' | 'ORDER_AMOUNT_CAPACITY' | 'INVALID_RETRY_KEY' | 'INVALID_CURRENCY' | 'INVALID_LINES' | 'RETRY_CONTENT_CONFLICT' | 'ORDER_LIMIT_EXCEEDED' | 'MENU_RESULT_UNAVAILABLE' | 'PRICE_CONFIRMATION_REQUIRED' | 'ORDER_RESPONSE_CAPACITY' | 'INSTALLATION_UNAVAILABLE' | 'ORDER_NOT_FOUND' | 'STALE_ORDER_POLICY';
export class OrdersError extends Error {
  constructor(readonly code: OrdersErrorCode, readonly details?: unknown) { super(code); }
}
export const MAX_LINES = 500, MAX_QUANTITY = 1000, RESPONSE_BYTES = 1_048_576;
export interface LimitPolicy { maxLines: number; maxQuantity: number; revision: number }
export const DEFAULT_POLICY: Readonly<LimitPolicy> = Object.freeze({ maxLines: 50, maxQuantity: 100, revision: 0 });
export function invalid(): never { throw new OrdersError('INVALID_ORDER_INPUT'); }
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (isRecord(value)) return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  const result = JSON.stringify(value);
  if (result === undefined) invalid();
  return result;
}
export function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).some(key => !keys.includes(key))) invalid();
  return value;
}
export function integer(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) invalid();
  return value;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid();
  return value.toLowerCase();
}
export function optionalText(value: unknown, maximum: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || /[\p{Cc}\p{Cs}]/u.test(value)) invalid();
  const result = value.trim();
  if ([...result].length > maximum) invalid();
  return result || undefined;
}
export interface Customer { name?: string; phone?: string }
export function customer(value: unknown): Customer | undefined {
  if (value === undefined) return undefined;
  const input = object(value, ['name', 'phone']);
  const name = optionalText(input.name, 120), phone = optionalText(input.phone, 32);
  if (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || !/[0-9]/.test(phone))) invalid();
  return name || phone ? { ...(name ? { name } : {}), ...(phone ? { phone } : {}) } : undefined;
}
export function minorAmount(value: unknown): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,23})$/.test(value)) invalid();
  return value;
}
export function checkedAmount(value: bigint): string {
  if (value < 0n || value >= 10n ** 24n) throw new OrdersError('ORDER_AMOUNT_CAPACITY');
  return value.toString();
}
