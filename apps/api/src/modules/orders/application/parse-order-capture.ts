import type { OrderSelection } from '../../menu/public.js';
import type { CaptureRequest } from './order-store.js';
import { OrdersError, MAX_LINES, MAX_QUANTITY, object, integer, optionalText, customer, minorAmount } from '../domain/capture.js';

export interface ParsedOrderCapture { key: string; request: CaptureRequest }

/** Pure structural normalization, shared by HTTP and non-HTTP callers. */
export function parseOrderCapture(value: unknown, normalize: (value: unknown) => OrderSelection): ParsedOrderCapture {
  const input = object(value, ['retryKey', 'currencyCode', 'scale', 'lines', 'customer', 'instructions']);
  if (typeof input.retryKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(input.retryKey)) throw new OrdersError('INVALID_RETRY_KEY');
  if (typeof input.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(input.currencyCode)) throw new OrdersError('INVALID_CURRENCY');
  const scale = integer(input.scale, 0, 4), rawLines = input.lines;
  if (!Array.isArray(rawLines) || !rawLines.length || rawLines.length > MAX_LINES) throw new OrdersError('INVALID_LINES');
  const lines = rawLines.map(value => {
    const row = object(value, ['selection', 'quantity', 'expectedUnitMinor', 'instructions']);
    const instructions = optionalText(row.instructions, 250);
    return { selection: normalize(row.selection), quantity: integer(row.quantity, 1, MAX_QUANTITY),
      expectedUnitMinor: minorAmount(row.expectedUnitMinor), ...(instructions ? { instructions } : {}) };
  });
  const details = customer(input.customer), instructions = optionalText(input.instructions, 500);
  return { key: input.retryKey, request: { currencyCode: input.currencyCode, scale, lines,
    ...(details ? { customer: details } : {}), ...(instructions ? { instructions } : {}) } };
}
