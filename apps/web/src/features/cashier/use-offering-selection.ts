import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Offering } from "@servicelane/api-contracts/menu";
import { resolveCashierSelection, type Selection } from "./cashier-menu-api";

export function useOfferingSelection(offering: Offering) {
  const [variantId, setVariantId] = useState(
    offering.kind === "item" && offering.variants.length === 1
      ? (offering.variants[0]?.id ?? "")
      : "",
  );
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const groups =
    offering.kind === "item" ? offering.addOnGroups : offering.choiceGroups;
  const valid =
    (offering.kind !== "item" || !!variantId) &&
    groups.every((group) => {
      const count = (selected[group.id] ?? []).length;
      return (
        count <= group.maximum &&
        (!("minimum" in group) ||
          (typeof group.minimum === "number" && count >= group.minimum))
      );
    });
  const selection: Selection = {
    offeringId: offering.id,
    ...(variantId ? { variantId } : {}),
    ...(offering.kind === "item"
      ? { addOnIds: groups.flatMap((group) => selected[group.id] ?? []) }
      : {
          choices: groups.map((group) => ({
            groupId: group.id,
            optionIds: selected[group.id] ?? [],
          })),
        }),
  };
  // Each selection has its own result. An earlier response cannot become the current preview.
  const preview = useQuery({
    queryKey: ["cashier-price-preview", selection],
    queryFn: () => resolveCashierSelection(selection),
    enabled: valid,
  });
  const ready =
    valid && !preview.isFetching && !preview.isError && !!preview.data;
  return {
    variantId,
    setVariantId,
    selected,
    setSelected,
    groups,
    valid,
    selection,
    preview,
    ready,
  };
}
