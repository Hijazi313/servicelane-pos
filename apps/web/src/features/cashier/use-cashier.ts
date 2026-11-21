import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Offering } from "@servicelane/api-contracts/menu";
import { HttpRequestError } from "../../shared/api/http-client.ts";
import {
  loadCashierMenu,
  resolveCashierSelection,
  type Selection,
  type ResolvedSelection,
} from "./cashier-menu-api.ts";
import {
  captureOrder,
  getCapturePolicy,
  getOrder,
  listOrders,
  priceConfirmation,
  type CaptureOrderRequest,
  type OrderSnapshot,
} from "./orders-api.ts";
import { money } from "./cashier-money.ts";

type DraftLine = {
  selection: Selection;
  resolved: ResolvedSelection;
  quantity: number;
  instructions: string;
};

export function useCashier() {
  const client = useQueryClient();
  const menu = useQuery({
    queryKey: ["cashier-menu"],
    queryFn: loadCashierMenu,
  });
  const policy = useQuery({
    queryKey: ["capture-policy"],
    queryFn: getCapturePolicy,
  });
  const [offering, setOffering] = useState<Offering>();
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pendingRequest, setPendingRequest] = useState<CaptureOrderRequest>();
  const unknownOutcome = useRef(false);
  const [message, setMessage] = useState("");
  const [priceChanged, setPriceChanged] = useState(false);
  const [repricing, setRepricing] = useState(false);
  const [saved, setSaved] = useState<OrderSnapshot>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cursor, setCursor] = useState<string>();
  const [previous, setPrevious] = useState<(string | undefined)[]>([]);
  const history = useQuery({
    queryKey: ["orders", cursor],
    queryFn: () => listOrders(cursor),
    enabled: historyOpen,
  });
  const [detailId, setDetailId] = useState<string>();
  const detail = useQuery({
    queryKey: ["order", detailId],
    queryFn: () => getOrder(detailId ?? ""),
    enabled: !!detailId,
  });
  const mutation = useMutation({
    mutationFn: captureOrder,
    onSuccess: (order) => {
      unknownOutcome.current = false;
      setPendingRequest(undefined);
      setLines([]);
      setName("");
      setPhone("");
      setInstructions("");
      setMessage("");
      setPriceChanged(false);
      setSaved(order);
      void client.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      const changed = priceConfirmation(error);
      if (changed) {
        unknownOutcome.current = false;
        setPendingRequest(undefined);
        setPriceChanged(true);
        setMessage(
          `Prices changed: ${changed.lines.map((entry) => `${lines[entry.line]?.resolved.name ?? `Item ${entry.line + 1}`}: ${money(entry.unitMinor, changed.currencyCode, changed.scale)} each`).join("; ")}. Refresh all prices and review before saving again.`,
        );
      } else if (
        !unknownOutcome.current &&
        error instanceof HttpRequestError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408
      ) {
        setPendingRequest(undefined);
        setMessage(
          "The order was not accepted. Check the details and availability, then try again.",
        );
      } else {
        unknownOutcome.current = true;
        setMessage(
          "The save may have completed. Retry this same request to safely check its result. Do not create another order for it.",
        );
      }
    },
  });
  async function refreshPrices() {
    setRepricing(true);
    setMessage("Checking current prices…");
    try {
      const prices = await Promise.all(
        lines.map((line) => resolveCashierSelection(line.selection)),
      );
      const firstPrice = prices[0];
      if (
        !firstPrice ||
        prices.some(
          (price) =>
            price.currencyCode !== firstPrice.currencyCode ||
            price.scale !== firstPrice.scale,
        )
      )
        throw new Error("Currency mismatch");
      setLines(
        lines.map((line, i) => ({
          ...line,
          resolved: prices[i] ?? line.resolved,
        })),
      );
      setPriceChanged(false);
      setMessage("Prices refreshed. Review the amounts before saving.");
    } catch {
      setMessage(
        "Could not refresh all prices. Check the menu and remove or replace unavailable items.",
      );
    } finally {
      setRepricing(false);
    }
  }
  function submit() {
    if (!lines.length || !policy.data) return;
    if (
      phone.trim() &&
      (!/^\+?[0-9 ()-]+$/.test(phone.trim()) || !/[0-9]/.test(phone))
    ) {
      setMessage(
        "Enter a valid phone number using digits, spaces, parentheses, hyphens and an optional leading plus.",
      );
      return;
    }
    if (
      [
        name,
        phone,
        instructions,
        ...lines.map((line) => line.instructions),
      ].some((value) => /[\p{Cc}\p{Cs}]/u.test(value))
    ) {
      setMessage(
        "Use plain text without line breaks or control characters in customer details and instructions.",
      );
      return;
    }
    const first = lines[0]?.resolved;
    if (!first) return;
    if (
      lines.some(
        (line) =>
          line.resolved.currencyCode !== first.currencyCode ||
          line.resolved.scale !== first.scale,
      )
    ) {
      setMessage("Menu currency changed. Refresh prices before saving.");
      setPriceChanged(true);
      return;
    }
    const request: CaptureOrderRequest = {
      retryKey: crypto.randomUUID(),
      currencyCode: first.currencyCode,
      scale: first.scale,
      lines: lines.map((line) => ({
        selection: {
          ...line.selection,
          addOnIds: line.selection.addOnIds ?? [],
          choices: line.selection.choices ?? [],
        },
        quantity: line.quantity,
        expectedUnitMinor: line.resolved.unitMinor,
        ...(line.instructions.trim()
          ? { instructions: line.instructions.trim() }
          : {}),
      })),
      ...(name.trim() || phone.trim()
        ? {
            customer: {
              ...(name.trim() ? { name: name.trim() } : {}),
              ...(phone.trim() ? { phone: phone.trim() } : {}),
            },
          }
        : {}),
      ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
    };
    setPendingRequest(request);
    mutation.mutate(request);
  }
  const locked = !!pendingRequest || mutation.isPending || repricing;
  const total = lines
    .reduce(
      (sum, line) =>
        sum + BigInt(line.resolved.unitMinor) * BigInt(line.quantity),
      0n,
    )
    .toString();
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  function updateLine(index: number, update: Partial<DraftLine>) {
    setLines(
      lines.map((line, i) => (i === index ? { ...line, ...update } : line)),
    );
  }
  function addLine(selection: Selection, resolved: ResolvedSelection) {
    if (policy.data && lines.length >= policy.data.maxLines) {
      setMessage(
        `This order has reached its limit of ${policy.data.maxLines} lines.`,
      );
      return;
    }
    setLines([
      ...lines,
      { selection, resolved, quantity: 1, instructions: "" },
    ]);
    setOffering(undefined);
    if (!priceChanged) setMessage("");
  }
  function removeLine(index: number) {
    const next = lines.filter((_, i) => index !== i);
    setLines(next);
    if (!next.length) {
      setPriceChanged(false);
      setMessage("");
    }
  }
  function openHistory() {
    setCursor(undefined);
    setPrevious([]);
    setHistoryOpen(true);
  }
  function restartHistory() {
    if (cursor === undefined) void history.refetch();
    else setCursor(undefined);
    setPrevious([]);
  }
  function previousPage() {
    setCursor(previous[previous.length - 1]);
    setPrevious(previous.slice(0, -1));
  }
  function nextPage() {
    setPrevious([...previous, cursor]);
    setCursor(history.data?.nextCursor ?? undefined);
  }
  function refreshHistory() {
    setCursor(undefined);
    setPrevious([]);
    void client.invalidateQueries({ queryKey: ["orders"] });
  }
  function retrySave() {
    if (pendingRequest) mutation.mutate(pendingRequest);
  }
  return {
    menu,
    policy,
    offering,
    setOffering,
    lines,
    name,
    setName,
    phone,
    setPhone,
    instructions,
    setInstructions,
    pendingRequest,
    message,
    priceChanged,
    repricing,
    saved,
    setSaved,
    historyOpen,
    setHistoryOpen,
    previous,
    history,
    detailId,
    setDetailId,
    detail,
    mutation,
    locked,
    total,
    itemCount,
    updateLine,
    addLine,
    removeLine,
    openHistory,
    restartHistory,
    previousPage,
    nextPage,
    refreshHistory,
    retrySave,
    refreshPrices,
    submit,
  };
}
