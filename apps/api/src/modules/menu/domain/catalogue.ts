import { randomUUID } from 'node:crypto';
import { CURRENCY_PRECISION } from './currency-precision.js';

export type MenuErrorReason = 'INVALID_INPUT' | 'DEFINITION_TOO_LARGE' | 'NOT_FOUND' | 'SELECTION_UNAVAILABLE' | 'CURRENCY_CHANGED' | 'STALE_REVISION' | 'CATALOGUE_CAPACITY' | 'UNSUPPORTED_CURRENCY' | 'CATALOGUE_UNAVAILABLE';
export class MenuError extends Error {
  constructor(readonly reason: MenuErrorReason, message: string) { super(message); }
}
export interface Variant { id: string; name: string; price: string; active: boolean }
export interface Extra { id: string; name: string; surcharge: string; active: boolean }
export interface ExtraGroup { id: string; name: string; maximum: number; options: Extra[] }
export interface Component { variantId: string; quantity: number }
export interface Choice extends Component, Extra {}
export interface ChoiceGroup { id: string; name: string; minimum: number; maximum: number; options: Choice[] }
interface Base { id: string; name: string; active: boolean; revision: number; currencyCode: string; scale: number }
export interface Item extends Base { kind: 'item'; sized: boolean; variants: Variant[]; addOnGroups: ExtraGroup[] }
export interface Combo extends Base { kind: 'combo'; basePrice: string; components: Component[]; choiceGroups: ChoiceGroup[] }
export type Offering = Item | Combo;
export function invalid(): never { throw new MenuError('INVALID_INPUT', 'Invalid menu input'); }
export function unavailable(): never { throw new MenuError('SELECTION_UNAVAILABLE', 'Selection unavailable'); }
export function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) invalid();
  return value as Record<string, unknown>;
}
export function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid();
  return (value as string).toLowerCase();
}
export function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) invalid();
  return value as number;
}
function name(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > 120 || /[\p{Cc}\p{Cs}]/u.test(value)) invalid();
  return (value as string).trim();
}
function flag(value: unknown): boolean { if (typeof value !== 'boolean') invalid(); return value as boolean; }
function list(value: unknown, max: number, min = 0): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) invalid();
  return value as unknown[];
}
function unique(values: string[]) { if (new Set(values).size !== values.length) invalid(); }
const labels = (values: { name: string }[]) => unique(values.map(value => value.name.toLowerCase()));
export function precision(currency: string): number {
  if (!Intl.supportedValuesOf('currency').includes(currency)) throw new MenuError('UNSUPPORTED_CURRENCY', 'Unsupported catalogue currency');
  const scale = CURRENCY_PRECISION[currency];
  if (scale === undefined || scale < 0 || scale > 4) throw new MenuError('UNSUPPORTED_CURRENCY', 'Unsupported catalogue currency');
  return scale;
}
export function minor(value: string, scale: number): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, '0') || '0');
}
export function decimal(value: bigint, scale: number): string {
  const digits = value.toString().padStart(scale + 1, '0');
  return scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
}
function price(value: unknown, scale: number): string {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,8})(\.\d+)?$/.test(value) || (value.split('.')[1]?.length ?? 0) > scale) invalid();
  return decimal(minor(value as string, scale), scale);
}
function nestedId(value: unknown, previous: { id: string }[]): string {
  if (value === undefined) return randomUUID();
  const parsed = id(value);
  if (!previous.some(row => row.id === parsed)) invalid();
  return parsed;
}
function component(value: unknown): Component {
  const row = object(value, ['variantId', 'quantity']);
  return { variantId: id(row.variantId), quantity: integer(row.quantity, 1, 1000) };
}
function extras(value: unknown, scale: number, previous: ExtraGroup[]): ExtraGroup[] {
  const groups = list(value, 8).map(value => {
    const row = object(value, ['id', 'name', 'maximum', 'options']);
    const groupId = nestedId(row.id, previous), old = previous.find(group => group.id === groupId);
    const options = list(row.options, 32, 1).map(value => {
      const option = object(value, ['id', 'name', 'surcharge', 'active']);
      return { id: nestedId(option.id, old?.options ?? []), name: name(option.name), surcharge: price(option.surcharge, scale), active: flag(option.active) };
    });
    unique(options.map(option => option.id)); labels(options);
    return { id: groupId, name: name(row.name), maximum: integer(row.maximum, 0, options.length), options };
  });
  unique(groups.map(group => group.id)); labels(groups); return groups;
}
export function definition(value: unknown, currencyCode: string, previous?: Offering): Offering {
  const input = object(value, ['kind', 'name', 'active', 'sized', 'variants', 'addOnGroups', 'basePrice', 'components', 'choiceGroups']);
  const scale = precision(currencyCode);
  if (previous && (previous.currencyCode !== currencyCode || previous.scale !== scale)) throw new MenuError('CURRENCY_CHANGED', 'Catalogue currency changed');
  if (previous && previous.kind !== input.kind) invalid();
  const base = { id: previous?.id ?? randomUUID(), name: name(input.name), active: flag(input.active), revision: (previous?.revision ?? 0) + 1, currencyCode, scale };
  if (input.kind === 'item') {
    if ('basePrice' in input || 'components' in input || 'choiceGroups' in input) invalid();
    const old = previous?.kind === 'item' ? previous : undefined;
    const variants = list(input.variants, 32, 1).map(value => {
      const row = object(value, ['id', 'name', 'price', 'active']);
      return { id: nestedId(row.id, old?.variants ?? []), name: name(row.name), price: price(row.price, scale), active: flag(row.active) };
    });
    unique(variants.map(variant => variant.id)); labels(variants);
    if (old?.variants.some(old => !variants.some(variant => variant.id === old.id))) invalid();
    const sized = flag(input.sized);
    if (!sized && variants.length !== 1) invalid();
    return { ...base, kind: 'item', sized, variants, addOnGroups: extras(input.addOnGroups, scale, old?.addOnGroups ?? []) };
  }
  if (input.kind !== 'combo' || 'variants' in input || 'sized' in input || 'addOnGroups' in input) invalid();
  const old = previous?.kind === 'combo' ? previous : undefined;
  const components = list(input.components, 32).map(component); unique(components.map(row => row.variantId));
  const choiceGroups = list(input.choiceGroups, 8).map(value => {
    const row = object(value, ['id', 'name', 'minimum', 'maximum', 'options']);
    const groupId = nestedId(row.id, old?.choiceGroups ?? []), prior = old?.choiceGroups.find(group => group.id === groupId);
    const options = list(row.options, 32, 1).map(value => {
      const option = object(value, ['id', 'name', 'variantId', 'quantity', 'surcharge', 'active']);
      return { id: nestedId(option.id, prior?.options ?? []), name: name(option.name), variantId: id(option.variantId), quantity: integer(option.quantity, 1, 1000), surcharge: price(option.surcharge, scale), active: flag(option.active) };
    });
    unique(options.map(option => option.id)); unique(options.map(option => option.variantId)); labels(options);
    const maximum = integer(row.maximum, 0, options.length);
    return { id: groupId, name: name(row.name), minimum: integer(row.minimum, 0, maximum), maximum, options };
  });
  unique(choiceGroups.map(group => group.id)); labels(choiceGroups);
  if (!components.length && !choiceGroups.some(group => group.minimum > 0)) invalid();
  return { ...base, kind: 'combo', basePrice: price(input.basePrice, scale), components, choiceGroups };
}
export function variantIndex(catalogue: Offering[]) {
  const index = new Map<string, { item: Item; variant: Variant }>();
  for (const item of catalogue) if (item.kind === 'item') for (const variant of item.variants) index.set(variant.id, { item, variant });
  return index;
}
export function references(combo: Combo): string[] {
  return [...new Set([...combo.components.map(row => row.variantId), ...combo.choiceGroups.flatMap(group => group.options.map(row => row.variantId))])];
}
export function saleable(offering: Offering, catalogue: Offering[]): boolean {
  if (!offering.active) return false;
  if (offering.kind === 'item') return offering.variants.some(variant => variant.active);
  const index = variantIndex(catalogue);
  const active = (ref: string) => { const found = index.get(ref); return !!found?.item.active && !!found.variant.active; };
  return offering.components.every(row => active(row.variantId)) && offering.choiceGroups.every(group => group.options.filter(option => option.active && active(option.variantId)).length >= group.minimum);
}
export function validateReferences(offering: Offering, catalogue: Offering[]) {
  if (offering.kind !== 'combo') return;
  const index = variantIndex(catalogue);
  for (const ref of references(offering)) if (!index.has(ref)) throw new MenuError('NOT_FOUND', 'Resource not found');
  // Even inactive definitions cannot newly save unsatisfiable required dependencies.
  if (!saleable({ ...offering, active: true }, catalogue)) unavailable();
}
export function activeView(offering: Offering, catalogue: Offering[]): Offering | undefined {
  if (!saleable(offering, catalogue)) return undefined;
  if (offering.kind === 'item') return { ...offering, variants: offering.variants.filter(row => row.active), addOnGroups: offering.addOnGroups.map(group => ({ ...group, options: group.options.filter(row => row.active) })) };
  const index = variantIndex(catalogue);
  return { ...offering, choiceGroups: offering.choiceGroups.map(group => ({ ...group, options: group.options.filter(option => option.active && index.get(option.variantId)?.item.active && index.get(option.variantId)?.variant.active) })) };
}
export interface ResolvedComponent { itemId: string; itemName: string; variantId: string; variantName: string; quantity: number }
export function resolveSelection(value: unknown, catalogue: Offering[]) {
  const input = object(value, ['offeringId', 'variantId', 'addOnIds', 'choices']);
  const offeringId = id(input.offeringId);
  const offering = catalogue.find(row => row.id === offeringId);
  if (!offering) throw new MenuError('NOT_FOUND', 'Resource not found');
  if (!saleable(offering, catalogue)) unavailable();
  const selectedIds = list(input.addOnIds ?? [], 256).map(id); unique(selectedIds);
  const selectedExtras: Extra[] = [], selectedChoices: { groupId: string; optionId: string; name: string; surcharge: string }[] = [];
  const components: ResolvedComponent[] = [];
  let base: string;
  if (offering.kind === 'item') {
    if (input.choices !== undefined) invalid();
    const chosen = input.variantId === undefined && !offering.sized ? offering.variants[0] : offering.variants.find(row => row.id === id(input.variantId));
    if (!chosen) invalid(); if (!chosen.active) unavailable(); base = chosen.price;
    for (const group of offering.addOnGroups) {
      const options = group.options.filter(option => selectedIds.includes(option.id));
      if (options.length > group.maximum) invalid();
      for (const option of options) { if (!option.active) unavailable(); selectedExtras.push(option); }
    }
    if (selectedExtras.length !== selectedIds.length) invalid();
    components.push({ itemId: offering.id, itemName: offering.name, variantId: chosen.id, variantName: chosen.name, quantity: 1 });
  } else {
    if (input.variantId !== undefined || selectedIds.length) invalid(); base = offering.basePrice;
    const index = variantIndex(catalogue);
    const add = (component: Component) => {
      const found = index.get(component.variantId); if (!found?.item.active || !found.variant.active) unavailable();
      components.push({ itemId: found.item.id, itemName: found.item.name, variantId: found.variant.id, variantName: found.variant.name, quantity: component.quantity });
    };
    offering.components.forEach(add);
    const choices = list(input.choices ?? [], 8).map(value => {
      const row = object(value, ['groupId', 'optionIds']); const optionIds = list(row.optionIds, 32).map(id); unique(optionIds);
      return { groupId: id(row.groupId), optionIds };
    }); unique(choices.map(choice => choice.groupId));
    if (choices.some(choice => !offering.choiceGroups.some(group => group.id === choice.groupId))) invalid();
    for (const group of offering.choiceGroups) {
      const ids = choices.find(choice => choice.groupId === group.id)?.optionIds ?? [];
      if (ids.length < group.minimum || ids.length > group.maximum) invalid();
      for (const optionId of ids) {
        const option = group.options.find(option => option.id === optionId); if (!option) invalid(); if (!option.active) unavailable();
        add(option); selectedChoices.push({ groupId: group.id, optionId: option.id, name: option.name, surcharge: option.surcharge });
      }
    }
  }
  const surchargeMinor = [...selectedExtras, ...selectedChoices].reduce((sum, option) => sum + minor(option.surcharge, offering.scale), 0n);
  return { offeringId: offering.id, name: offering.name, revision: offering.revision, currencyCode: offering.currencyCode, scale: offering.scale, basePrice: base, surcharge: decimal(surchargeMinor, offering.scale), total: decimal(minor(base, offering.scale) + surchargeMinor, offering.scale), components, addOns: selectedExtras, choices: selectedChoices };
}
