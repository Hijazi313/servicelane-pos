/** Menu HTTP definitions. Prices are exact decimal strings. */
export interface Variant { id: string; name: string; price: string; active: boolean }
export interface Extra { id: string; name: string; surcharge: string; active: boolean }
export interface ExtraGroup { id: string; name: string; maximum: number; options: Extra[] }
export interface Component { variantId: string; quantity: number }
export interface Choice extends Component, Extra {}
export interface ChoiceGroup { id: string; name: string; minimum: number; maximum: number; options: Choice[] }
interface Metadata { id: string; name: string; active: boolean; revision: number; currencyCode: string; scale: number }
export interface Item extends Metadata { kind: 'item'; sized: boolean; variants: Variant[]; addOnGroups: ExtraGroup[] }
export interface Combo extends Metadata { kind: 'combo'; basePrice: string; components: Component[]; choiceGroups: ChoiceGroup[] }
export type Offering = Item | Combo;

type Editable<T extends { id: string }> = Omit<T, 'id'> & { id?: string };
export type VariantInput = Editable<Variant>;
export type ExtraInput = Editable<Extra>;
export type ExtraGroupInput = Omit<Editable<ExtraGroup>, 'options'> & { options: ExtraInput[] };
export type ChoiceInput = Editable<Choice>;
export type ChoiceGroupInput = Omit<Editable<ChoiceGroup>, 'options'> & { options: ChoiceInput[] };
export interface ItemDefinition { kind: 'item'; name: string; active: boolean; sized: boolean; variants: VariantInput[]; addOnGroups: ExtraGroupInput[] }
export interface ComboDefinition { kind: 'combo'; name: string; active: boolean; basePrice: string; components: Component[]; choiceGroups: ChoiceGroupInput[] }
export type Definition = ItemDefinition | ComboDefinition;
export interface CreateOfferingRequest { definition: Definition }
export interface UpdateOfferingRequest extends CreateOfferingRequest { expectedRevision: number }
