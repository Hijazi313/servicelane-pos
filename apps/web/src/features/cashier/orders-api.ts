import { HttpRequestError, request, write } from '../../shared/api/http-client.ts';

export interface OrderSelection {
  offeringId: string;
  variantId?: string;
  addOnIds: string[];
  choices: { groupId: string; optionIds: string[] }[];
}
export interface CaptureOrderRequest {
  retryKey: string;
  currencyCode: string;
  scale: number;
  lines: { selection: OrderSelection; quantity: number; expectedUnitMinor: string; instructions?: string }[];
  customer?: { name?: string; phone?: string };
  instructions?: string;
}
export interface OrderSummary {
  id: string; createdAt: string; state: 'captured'; fulfillment: 'takeaway';
  currencyCode: string; scale: number; totalMinor: string;
}
export interface OrderSnapshot extends OrderSummary {
  customer?: { name?: string; phone?: string };
  instructions?: string;
  lines: {
    quantity: number; instructions?: string; lineMinor: string;
    unit: {
      name: string; unitMinor: string;
      components: { itemName: string; variantName: string; quantity: number }[];
      addOns: { name: string }[];
      choices: { name: string }[];
    };
  }[];
}
export interface CapturePolicy { maxLines: number; maxQuantity: number; revision: number }
export interface PriceConfirmation {
  currencyCode: string; scale: number; lines: { line: number; unitMinor: string }[];
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function optionalString(value: unknown): boolean { return value === undefined || typeof value === 'string'; }
function amount(value: unknown): value is string { return typeof value === 'string' && /^(0|[1-9][0-9]{0,23})$/.test(value); }
function integer(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function summary(value: unknown): value is OrderSummary {
  return record(value) && typeof value.id === 'string' && typeof value.createdAt === 'string' &&
    value.state === 'captured' && value.fulfillment === 'takeaway' && typeof value.currencyCode === 'string' &&
    integer(value.scale) && value.scale <= 4 && amount(value.totalMinor);
}
function line(value: unknown): value is OrderSnapshot['lines'][number] {
  if (!record(value) || !integer(value.quantity) || value.quantity === 0 || !optionalString(value.instructions) || !amount(value.lineMinor) || !record(value.unit)) return false;
  const unit = value.unit;
  return typeof unit.name === 'string' && amount(unit.unitMinor) &&
    Array.isArray(unit.components) && unit.components.every(component => record(component) && typeof component.itemName === 'string' && typeof component.variantName === 'string' && integer(component.quantity)) &&
    Array.isArray(unit.addOns) && unit.addOns.every(option => record(option) && typeof option.name === 'string') &&
    Array.isArray(unit.choices) && unit.choices.every(option => record(option) && typeof option.name === 'string');
}
function snapshot(value: unknown): value is OrderSnapshot {
  return summary(value) && record(value) && optionalString(value.instructions) &&
    (value.customer === undefined || (record(value.customer) && optionalString(value.customer.name) && optionalString(value.customer.phone))) &&
    Array.isArray(value.lines) && value.lines.every(line);
}

export async function captureOrder(body: CaptureOrderRequest): Promise<OrderSnapshot> {
  const response = await write('orders', 'POST', body);
  if (!record(response) || !snapshot(response.data)) throw new Error('Unexpected order response');
  return response.data;
}
export async function getOrder(id: string): Promise<OrderSnapshot> {
  const response = await request(`orders/${encodeURIComponent(id)}`);
  if (!snapshot(response)) throw new Error('Unexpected order response');
  return response;
}
export async function listOrders(cursor?: string): Promise<{ orders: OrderSummary[]; nextCursor: string | null }> {
  const query = cursor ? `?${new URLSearchParams({ cursor })}` : '';
  const response = await request(`orders${query}`);
  if (!record(response) || !Array.isArray(response.data) || !response.data.every(summary) ||
      !record(response.meta) || !record(response.meta.page) ||
      !(response.meta.page.nextCursor === null || typeof response.meta.page.nextCursor === 'string')) throw new Error('Unexpected order list response');
  return { orders: response.data, nextCursor: response.meta.page.nextCursor };
}
export async function getCapturePolicy(): Promise<CapturePolicy> {
  const response = await request('orders/capture-policy');
  if (!record(response) || !integer(response.maxLines) || !integer(response.maxQuantity) || !integer(response.revision)) throw new Error('Unexpected capture policy');
  return { maxLines: response.maxLines, maxQuantity: response.maxQuantity, revision: response.revision };
}
export function priceConfirmation(error: unknown): PriceConfirmation | undefined {
  if (!(error instanceof HttpRequestError) || error.status !== 409 || !record(error.problem) ||
      error.problem.type !== '/problems/price-confirmation-required' || !record(error.problem.details)) return undefined;
  const details = error.problem.details;
  if (typeof details.currencyCode !== 'string' || !integer(details.scale) || details.scale > 4 || !Array.isArray(details.lines) ||
      !details.lines.every(entry => record(entry) && integer(entry.line) && amount(entry.unitMinor))) return undefined;
  return { currencyCode: details.currencyCode, scale: details.scale, lines: details.lines.map(entry => ({ line: entry.line, unitMinor: entry.unitMinor })) };
}
