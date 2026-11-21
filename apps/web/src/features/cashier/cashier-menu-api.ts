import type { Extra, Offering } from '@servicelane/api-contracts/menu';
import { request } from '../../shared/api/http-client.ts';
import { validateOffering } from '../menu/public.ts';

export type Selection = {
  offeringId: string;
  variantId?: string;
  addOnIds?: string[];
  choices?: { groupId: string; optionIds: string[] }[];
};

type Component = { itemId: string; itemName: string; variantId: string; variantName: string; quantity: number };
type SelectedChoice = { groupId: string; optionId: string; name: string; surcharge: string };
export type ResolvedSelection = {
  offeringId: string;
  name: string;
  currencyCode: string;
  scale: number;
  unitMinor: string;
  components: Component[];
  addOns: Extra[];
  choices: SelectedChoice[];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function component(value: unknown): value is Component {
  return record(value) && typeof value.itemId === 'string' && typeof value.itemName === 'string' &&
    typeof value.variantId === 'string' && typeof value.variantName === 'string' &&
    Number.isSafeInteger(value.quantity) && typeof value.quantity === 'number' && value.quantity > 0;
}

function extra(value: unknown): value is Extra {
  return record(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    typeof value.surcharge === 'string' && typeof value.active === 'boolean';
}

function choice(value: unknown): value is SelectedChoice {
  return record(value) && typeof value.groupId === 'string' && typeof value.optionId === 'string' &&
    typeof value.name === 'string' && typeof value.surcharge === 'string';
}

export async function loadCashierMenu(): Promise<Offering[]> {
  const response = await request('menu/offerings');
  if (!record(response) || !Array.isArray(response.data) || !response.data.every(validateOffering)) {
    throw new Error('Unexpected menu response');
  }
  return response.data;
}

export async function resolveCashierSelection(selection: Selection): Promise<ResolvedSelection> {
  const value = await request('menu/resolve', {
    method: 'QUERY',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(selection),
  });
  if (!record(value) || typeof value.offeringId !== 'string' || typeof value.name !== 'string' ||
      typeof value.currencyCode !== 'string' || typeof value.scale !== 'number' ||
      !Number.isInteger(value.scale) || value.scale < 0 || value.scale > 4 ||
      typeof value.total !== 'string' || !Array.isArray(value.components) || !value.components.every(component) ||
      !Array.isArray(value.addOns) || !value.addOns.every(extra) ||
      !Array.isArray(value.choices) || !value.choices.every(choice)) {
    throw new Error('Unexpected menu resolution');
  }
  const amount = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value.total);
  if (!amount || (amount[2]?.length ?? 0) > value.scale) throw new Error('Unexpected menu resolution');
  const unitMinor = BigInt(amount[1] + (amount[2] ?? '').padEnd(value.scale, '0')).toString();
  return { offeringId: value.offeringId, name: value.name, currencyCode: value.currencyCode,
    scale: value.scale, unitMinor, components: value.components, addOns: value.addOns, choices: value.choices };
}
