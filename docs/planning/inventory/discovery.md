# Inventory — next phase

Status: proposed discovery, 2026-10-31. [Global tracker](../TRACKER.md) owns current focus. The user accepted Cashier Shifts' bounded backend scope and asked to prepare the next phase. This document does not authorize Inventory implementation, database changes or deployment.

## Outcome and smallest useful increment

An authorized restaurant operator can identify what is stocked at a branch and record stock coming in, stock counted and stock lost, with a traceable reason and actor. The product must support multiple businesses and branch-scoped stock. The exact initial stock model is not yet an approved product decision.

**Recommendation for IN-00:** agree the stock unit and first operational workflow, then specify a small manual stock ledger. Candidate IN-01 would support stock items with a clear base unit, opening count and explicit stock-in/adjustment/waste movements, current balance, authorization, safe retries and history. These are proposed phase P0 only if the owner confirms manual stock tracking is needed: without movements the operator cannot explain a balance; an editable quantity alone loses that history. No supplier purchase-order system, costing engine or automatic recipe deductions is assumed.

Example: a branch starts with 10 kg of flour, receives 5 kg and records 1 kg waste; expected stock is 14 kg. A physical count can differ; the stock adjustment must preserve the earlier movements and the reason. Define decimal precision and measurement units before implementation rather than using floating point or assuming each restaurant uses kilograms.

## Decisions to settle before source work

1. **What is tracked first?** Ingredients such as flour and oil, finished sellable products, or both? Recommendation: ingredients and other explicitly stocked items; a Menu offering is not automatically a stock item.
2. **How is stock reduced?** Manual movements initially, or automatically when an order is captured, sent to Kitchen, paid or completed? Recommendation: start manual unless actual service needs demand a specific automatic point. An automatic path requires recipe quantities, sizes/add-ons/combos, idempotency, cancellation/refund and out-of-stock policy; deferring it means the system does not know real-time consumption from sales.
3. **What can staff record?** Confirm who may receive, count, correct and record waste. Reuse the existing staff/admin access model where it fits; do not assume a new role.
4. **Stock counts and negative balances:** confirm whether physical counts can correct the ledger and whether stock can go below zero. Recommendation: preserve every correction with a reason and actor; decide negative stock explicitly based on restaurant practice.

Operator validation can proceed alongside specification work; a complete restaurant workflow is not a prerequisite for drafting. These questions are product decisions, not requests for implementation permission.

## Existing boundaries and release dependencies

- [Menu capabilities](../../../apps/api/src/modules/menu/docs/capabilities.md) resolve offerings, sizes, add-ons and combos for pricing; they do not manage stock or recipes. Menu owns catalogue data; Inventory owns stock movements. Do not infer ingredient quantities from product names.
- [Orders capabilities](../../../apps/api/src/modules/orders/docs/capabilities.md) capture immutable order snapshots; there is no accepted inventory-deduction hook. An automatic sale deduction requires a separately designed, transaction-safe integration through public interfaces, not direct access to foreign tables.
- [Access capabilities](../../../apps/api/src/modules/authentication/docs/capabilities.md) provide verified branch context and transactional authorization. Inventory must reuse them and keep each branch's records separate.
- [Cross-cutting requirements](../../modules/README.md#cross-cutting-operational-requirements) require auditable stock movements and defining units, deduction timing, waste and refunds before claiming automatic consumption. Recovery, operational configuration and the complete trading-flow acceptance remain release work.
- Cashier Shifts' accepted backend increment can remain closed while Inventory is scoped. Its [handoff](../../../apps/api/src/modules/cashier-shifts/docs/features/drawer-sessions/phase-tracker.md#current-handoff) retains unmounted routes, correction workflows and release limits. Inventory planning does not activate Cashier or change its acceptance.

## Next steps

IN-00: settle the four questions, identify the stock item and movement rules, and document acceptance examples before authorizing source work. IN-01: implement only the agreed smallest slice with focused offline checks; persistence verification and any order integration follow their own bounded scope. Defer expiry/batches, purchasing, transfers, valuation, suppliers, analytics and advanced forecasting unless a confirmed first-release workflow makes one necessary. Exact scope and priorities remain proposed.

Incidents: none in this Inventory discovery. Existing incident reviews remain pending in the [approved log](../../quality/agent-incidents.md).
