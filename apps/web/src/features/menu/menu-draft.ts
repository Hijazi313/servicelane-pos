import type { ComboDefinition, Definition, ItemDefinition } from '@servicelane/api-contracts/menu';

export type MenuDraft = {
  kind: 'item' | 'combo';
  name: string;
  active: boolean;
  sized: boolean;
  variants: ItemDefinition['variants'];
  addOnGroups: ItemDefinition['addOnGroups'];
  basePrice: string;
  components: ComboDefinition['components'];
  choiceGroups: ComboDefinition['choiceGroups'];
};

export function definitionFromDraft(values: MenuDraft): Definition {
  if (values.kind === 'item') {
    return {
      kind: 'item',
      name: values.name,
      active: values.active,
      sized: values.sized,
      variants: values.variants.map(variant => ({
        ...variant,
        name: values.sized ? variant.name : (variant.name || 'Standard'),
      })),
      addOnGroups: (values.addOnGroups ?? []).map(group => ({
        ...(group.id ? { id: group.id } : {}),
        name: group.name,
        maximum: group.maximum,
        options: group.options.map(option => ({
          ...(option.id ? { id: option.id } : {}),
          name: option.name,
          surcharge: option.surcharge,
          active: option.active,
        })),
      })),
    };
  }

  return {
    kind: 'combo',
    name: values.name,
    active: values.active,
    basePrice: values.basePrice,
    components: values.components ?? [],
    choiceGroups: (values.choiceGroups ?? []).map(group => ({
      ...(group.id ? { id: group.id } : {}),
      name: group.name,
      minimum: group.minimum,
      maximum: group.maximum,
      options: group.options.map(option => ({
        ...(option.id ? { id: option.id } : {}),
        name: option.name,
        variantId: option.variantId,
        quantity: option.quantity,
        surcharge: option.surcharge,
        active: option.active,
      })),
    })),
  };
}
