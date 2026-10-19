# Orders — initial discovery proposal

Date: 2026-10-19. Owner: primary agent. Updated: 2026-10-20. Status: three product decisions approved for planning; detailed OR-01 contract proposed, implementation unapproved. Parent: [global tracker](../TRACKER.md). Entry: accepted Menu/MN-00 integrated through [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9), squash `b09770e`.

The user authorized reviewing/merging Menu and proceeding with the remaining next-step work. The 2026-10-20 user instruction, “I approve all three for planning,” confirms the decisions below. Existing authorization covers proposal/contract refinement, affected documentation, focused offline checks, local Conventional Commit checkpoints and necessary updates to draft PR #10. It does not authorize source/database work or merge. Checkout: `codex/orders-discovery`, based on merged `main`; preserve the pre-existing untracked Menu acceptance ledger. No Orders source/module scaffold exists; keep initial discovery here until an approved increment merits its owning module spec/tracker.

## Proposed first outcome

Plan one backend increment, **OR-01: record and read an order submitted at the counter**, with one or more configured Menu selling units and positive line quantities. Counter/takeaway capture and readback is approved as the first planning outcome; detailed contracts and acceptance remain proposed.

No server-persisted cart, UI, kitchen dispatch or payment is needed to demonstrate initial capture. Later order amendments/cancellation/fulfilment/billing are separate discovery, not claims of optional product behavior. The first increment is not a usable end-to-end POS or fiscal sale.

## Existing capabilities and gaps

Indexes/contracts reviewed: [Menu](../../../apps/api/src/modules/menu/docs/capabilities.md), [Authentication](../../../apps/api/src/modules/authentication/docs/capabilities.md), [Business](../../../apps/api/src/modules/business/docs/capabilities.md). Existing source searches found no Orders module, public order operations or prior Orders plan.

| Owner / existing capability | Reuse / missing boundary |
| --- | --- |
| Authentication `runAuthorized` | Current staff/admin/session/CSRF/grant checks, trusted installation and active opaque transaction. Call it once per order mutation; no nested access call or extra connection inside callback |
| Business installation context | Business/branch/currency/timezone remain Business-owned; obtain trusted scope through Authentication, not client-selected ownership or duplicated binding checks |
| Menu catalogue/pricing | Reuse existing definition/availability/selection and exact-price rules. Current supported interface exports only MenuModule; HTTP preview is not a supported transactional Orders API |
| Orders capture/persistence | New Orders-owned branch-scoped order, line snapshot and retry semantics; no existing capability to reuse |

Before implementation, specify a narrow supported Menu application operation/provider export that resolves all requested units from one coherent catalogue snapshot in the caller's active transaction. It must not invoke its own authorization, HTTP endpoints or nested transactions, or expose tables/query builders. Existing Menu domain rules stay Menu-owned. A new supported Menu consumer interface is an explicitly proposed cross-module OR-01 deliverable, with matching public/provider exports and capability-index upkeep when implemented; accepted MN-01 evidence is retained. Its detailed contract is proposed below.

## Proposed phase P0 and observable acceptance

The following phase P0 is proposed to meet the approved planning outcome; detailed scope approval, implementation and user acceptance remain separate. Use one ordinary transaction and owned records, not a workflow engine/event bus.

| Acceptance ID / outcome and reason | Proposed observation |
| --- | --- |
| OR-A01: Authorized business/branch capture and reads — prevents cross-installation or unauthorized records | Staff/admin policy enforced through existing access; invalid/revoked/grant-denied requests create nothing and foreign order IDs disclose nothing |
| OR-A02: Resolve selected items/variants/extras/combo choices against current Menu — prevents storing client-spoofed or unavailable selections | Valid submission stores server-resolved composition and amounts; inactive, foreign or invalid selections reject atomically |
| OR-A03: Immutable order-time merchandise snapshots — Menu edits must not rewrite captured history | Retain offering/variant/option identities, displayed names, resolved components, quantity, currency/scale and exact unit/line amounts; changing/deactivating Menu later leaves captured lines unchanged |
| OR-A04: Atomic order and lines with a retry key — a lost response must not create duplicate orders | Same scoped key and same request returns the same order; a different request using that key conflicts; concurrent retries create one aggregate; injected failure leaves no partial order/lines |
| OR-A05: Deliberate price-change policy — preview is nonbinding, not proof of customer confirmation | Changed merchandise amounts reject without capture; resubmission with the reviewed current amounts can succeed. No customer-consent proof is claimed |
| OR-A06: Bounded readback after process restart — makes capture durable rather than memory-only | Read back the same branch-scoped order, snapshots and amounts after a fresh API process, on a separately authorized disposable target |

Before source work, turn this into a bounded spec with request/line/quantity limits compatible with the existing 16 KiB transport, state/error contracts, retry-key scope/retention and focused checks. Persistence/restart/concurrency execution needs separate target-specific permission; none is inherited from Menu. Do not run old Menu acceptance harnesses on the migrated target.

## Product decisions approved for planning — 2026-10-20

1. **Journey:** counter/takeaway capture and readback, without persisted carts, kitchen dispatch or payment.
2. **Price changes:** reject an attempted capture if merchandise prices have changed before submission and require reconfirmation of updated amounts. The expected-amount protocol below is a proposed technical mechanism, not an approved contract or proof of customer consent.
3. **Tax boundary:** this development increment records merchandise amounts only. Tax is unresolved, never zero/exempt by inference; there is no payable total, fiscal sale or receipt. No tax applicability, inclusive/exclusive treatment or accountant approval is asserted. Follow [compliance guidance](../../compliance/README.md) before activating affected operational workflows.

Captured means stored only, never paid, dispatched or fiscally finalized. Tax calculation, payment recording and sale-time fiscal snapshot ownership/timing remain to be decided during later discovery; they are not assigned by this proposal. Kitchen/payment ordering (including prepayment), amendments and cancellation must be resolved before operational use.

## Proposed OR-01 contract and boundaries

These details are recommendations for review, not additional approved requirements or available APIs.

- **Interface:** create one captured takeaway order and fetch one order by opaque ID. No listing/search, draft-cart API, customer identity, notes, table or delivery fields. Request ownership is server-resolved; reject client-supplied business/branch, state, tax or payable totals.
- **Bounds:** retain the existing 16,384-byte request limit; propose 1–50 lines and integer line quantities 1–100. Menu retains its own selection limits. Both body size and semantic limits apply; 50 maximally complex lines need not fit. Reject unknown fields and malformed/overflowing amounts before persistence.
- **Expected amounts:** each line supplies its Menu selection, quantity and expected unit merchandise amount with expected currency/scale. Menu validates/canonicalizes expected money using its own precision rules and resolves current prices. Compare every line, rather than only an aggregate where increases/decreases could cancel. On mismatch return a bounded current resolved proposal and conflict; no order or successful retry record is committed. A client reviews it and resubmits with updated expectations. Menu may change again, requiring another comparison. Existing single-selection HTTP preview remains nonbinding.
- **Menu application boundary:** propose one read-only batch resolution operation accepting trusted authorized installation/transaction scope and bounded selections/expected money. Read the catalogue once, reuse existing Menu selection rules, and return only selected identities/names/composition, currency/scale, canonical unit amounts, exact minor-unit integers and price-match results. No foreign persistence types, raw catalogue or query builders. Currency parsing/precision and configured unit pricing remain Menu-owned; Orders performs only integer quantity multiplication/summation with explicit bounds. Application results/errors remain independent of HTTP; the Orders HTTP boundary maps them.
- **Transaction coordination:** creation invokes existing staff-policy `runAuthorized` once, then uses only the callback's trusted scope and active transaction. Menu reads its own data; Orders writes only its own order/lines/retry records. All work is awaited and bounded; no nested authorization/transaction, extra connection or external I/O. Shared authorization locking already serializes these current mutation paths; batch resolution must still use one catalogue snapshot. Do not assume a transaction alone prevents all future concurrent catalogue changes.
- **Read authorization:** use the existing shared HTTP staff policy and current installation resolution pattern, then query only the trusted business/branch and requested order ID. Return indistinguishable not-found for absent/foreign IDs; do not expose a globally fetched record before checking scope. No new RBAC or client-selected context.
- **Snapshot ownership:** Orders stores resolved names/identities/components, submitted selection, quantities and exact merchandise amounts at capture. It reads history from its own snapshot without re-resolving current Menu. Store currency/scale explicitly; no inference of fiscal meaning. One initial state, `captured`, with no state-transition API.
- **Retry semantics:** propose a 16–128 character opaque ASCII key scoped to business/branch, retained with the order with no expiry or cleanup API in OR-01. Compare a canonical validated request, including selection, quantities and expected amounts, not raw JSON property ordering. Recheck current authorization first. An existing matching success returns its stored order before consulting current Menu, even after a price/availability change or process restart. Same key/different request conflicts. First successful capture and its key commit atomically; concurrent attempts yield one order. Validation/price conflicts reserve no successful key; corrected resubmission may reuse it. Key possession grants no read access.
- **Errors:** propose 400 for invalid shape/bounds, existing 401/403 authorization behavior, 404 for unavailable identifiers without foreign disclosure, 409 for current-price/availability/currency or retry-content conflicts, and sanitized 503 for persistence failure. Preserve existing Menu error semantics where applicable; exact transport mapping must be reconciled with its contracts before source authorization. No partial aggregate on any failure.

## Planning tasks, acceptance and handoff

| Task | Status / exit evidence |
| --- | --- |
| OR-P01: settle first workflow, price policy and tax boundary | Complete for planning: direct user approval on 2026-10-20; no implementation/acceptance claim |
| OR-P02: refine bounded scope and Menu consumer contract | Proposed above for user review against OR-A01–06; no source scaffold |
| OR-P03: implementation and focused offline verification | Not authorized; review contract/bounds/error choices first |
| OR-P04: persistence/concurrency/restart acceptance | Not authorized or run; requires a separately approved target/procedure and later user acceptance |

Source review confirms Menu currently exports only MenuModule; its internal resolver handles one selection and returns decimal prices/composition. The batch consumer/exact-money application result is missing. Authentication's callback already carries trusted installation and opaque transaction. These are source facts, not Orders behavior evidence. Existing passing Menu checks are reused; no runtime or database check is justified by these documentation changes.

Planning completion produces a reviewable contract, not an operational order flow. Acceptance must demonstrate OR-A01–06, including successful retries after Menu changes, changed-request conflicts, concurrent duplicate attempts and rollback. Offline checks can establish application/HTTP behavior with substitutes; durable persistence, concurrency and fresh-process readback require separately authorized execution and remain unverified.

## Deferred scope and next authorization

Phase P1: persistent carts, categories/search UX, customer profiles, table management, delivery integrations, promotional pricing and configurable workflow engines. None is justified for first capture. Kitchen, billing/tax, payments, amendments/cancellation, shifts, inventory and recovery remain later product/release obligations, not waived by this slice.

Next: review the proposed detailed OR-01 contract, limits and acceptance outcomes. Existing planning authorization covers revisions and draft PR updates; source implementation needs explicit separate permission after review. No installation, database access/migrations, provisioning, deployment or merge is authorized. Preserve the local Menu ledger and historical evidence. Incidents: none newly identified in this planning checkpoint; existing incident reviews remain pending and unchanged.
