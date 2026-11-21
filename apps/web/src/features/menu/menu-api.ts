import type { Choice, ChoiceGroup, Component, CreateOfferingRequest, Definition, Extra, ExtraGroup, Offering, UpdateOfferingRequest, Variant } from '@servicelane/api-contracts/menu';
import { HttpRequestError, request, write } from '../../shared/api/http-client.ts';
export type { Definition, Offering } from '@servicelane/api-contracts/menu';

export { HttpRequestError as MenuRequestError };
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function named(value: unknown): value is Record<string, unknown> {
  return record(value) && typeof value.id === 'string' &&
    typeof value.name === 'string' && typeof value.active === 'boolean';
}

function variant(value: unknown): value is Variant {
  return named(value) && typeof value.price === 'string';
}

function extra(value: unknown): value is Extra {
  return named(value) && typeof value.surcharge === 'string';
}

function component(value: unknown): value is Component {
  return record(value) && typeof value.variantId === 'string' && Number.isSafeInteger(value.quantity);
}

function extraGroup(value: unknown): value is ExtraGroup {
  return record(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    Number.isSafeInteger(value.maximum) && Array.isArray(value.options) && value.options.every(extra);
}

function choice(value: unknown): value is Choice {
  return extra(value) && component(value);
}

function choiceGroup(value: unknown): value is ChoiceGroup {
  return record(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    Number.isSafeInteger(value.minimum) && Number.isSafeInteger(value.maximum) &&
    Array.isArray(value.options) && value.options.every(choice);
}

export function offering(value: unknown): value is Offering {
  if (!named(value) || !Number.isSafeInteger(value.revision) ||
      typeof value.currencyCode !== 'string' || !Number.isSafeInteger(value.scale)) return false;
  if (value.kind === 'item') {
    return typeof value.sized === 'boolean' && Array.isArray(value.variants) &&
      value.variants.every(variant) && Array.isArray(value.addOnGroups) && value.addOnGroups.every(extraGroup);
  }
  return value.kind === 'combo' && typeof value.basePrice === 'string' &&
    Array.isArray(value.components) && value.components.every(component) &&
    Array.isArray(value.choiceGroups) && value.choiceGroups.every(choiceGroup);
}

export async function loadMenu(): Promise<{
  definitions: Offering[];
  active: Offering[];
  currency: string;
}> {
  const [definitions, active, context] = await Promise.all([
    request("menu/definitions"),
    request("menu/offerings"),
    request("context"),
  ]);
  if (
    !Array.isArray(definitions) || !definitions.every(offering) ||
    !active ||
    typeof active !== "object" ||
    !("data" in active) ||
    !Array.isArray(active.data) || !active.data.every(offering) ||
    !context ||
    typeof context !== "object" ||
    !("business" in context) ||
    !context.business ||
    typeof context.business !== "object" ||
    !("currencyCode" in context.business) ||
    typeof context.business.currencyCode !== "string"
  )
    throw new Error("Unexpected menu response");
  return {
    definitions,
    active: active.data,
    currency: context.business.currencyCode,
  };
}
export async function saveMenu(
  definition: Definition,
  initial?: Offering,
): Promise<string> {
  const body: CreateOfferingRequest | UpdateOfferingRequest = initial
    ? { definition, expectedRevision: initial.revision }
    : { definition };
  const saved = await write(initial ? `menu/offerings/${initial.id}` : "menu/offerings", initial ? 'PUT' : 'POST', body);
  if (!record(saved) || typeof saved.id !== "string" || !saved.id) throw new Error("Unexpected save response");
  return saved.id;
}
