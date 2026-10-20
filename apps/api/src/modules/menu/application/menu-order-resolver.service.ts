import { Injectable } from "@nestjs/common";
import type { AuthorizedScope } from "../../authentication/public.js";
import {
  MenuService,
  type OrderSelection,
  type ResolvedOrderUnit,
} from "./menu.service.js";
import { id, integer, invalid, object } from "../domain/catalogue.js";
export { MenuError, type MenuErrorReason } from "../domain/catalogue.js";
export type { OrderSelection, ResolvedOrderUnit } from "./menu.service.js";
function ids(value: unknown, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) invalid();
  const result = value.map(id).sort();
  if (new Set(result).size !== result.length) invalid();
  return result;
}
@Injectable()
export class MenuOrderResolver {
  constructor(private readonly menu: MenuService) {}
  // Structural normalization only: safe for replay after catalogue changes.
  normalize(value: unknown): OrderSelection {
    const input = object(value, [
      "offeringId",
      "variantId",
      "addOnIds",
      "choices",
    ]);
    const rawChoices = input.choices ?? [];
    if (!Array.isArray(rawChoices)) invalid();
    integer(rawChoices.length, 0, 8);
    const choices = rawChoices
      .map((value) => {
        const row = object(value, ["groupId", "optionIds"]);
        return { groupId: id(row.groupId), optionIds: ids(row.optionIds, 32) };
      })
      .sort((a, b) => a.groupId.localeCompare(b.groupId));
    if (new Set(choices.map((row) => row.groupId)).size !== choices.length)
      invalid();
    return {
      offeringId: id(input.offeringId),
      ...(input.variantId === undefined
        ? {}
        : { variantId: id(input.variantId) }),
      addOnIds: ids(input.addOnIds ?? [], 256),
      choices,
    };
  }
  resolve(
    scope: AuthorizedScope,
    selections: readonly OrderSelection[],
  ): Promise<ResolvedOrderUnit[]> {
    if (!selections.length || selections.length > 500) invalid();
    return this.menu.resolveOrderUnits(scope, selections);
  }
}
