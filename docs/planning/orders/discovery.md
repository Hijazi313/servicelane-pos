# Orders — initial discovery proposal

Date: 2026-10-19. Owner: primary agent. Status: proposed; planning authorized, implementation unapproved. Parent: [global tracker](../TRACKER.md). Entry: accepted Menu/MN-00 integrated through [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9), squash `b09770e`.

The user authorized reviewing/merging Menu and proceeding with the remaining next-step work. This document interprets that continuation as Orders discovery/planning only, not approval of unresolved product behavior or source/database work. Checkout: `codex/orders-discovery`, based on merged `main`; preserve the pre-existing untracked Menu acceptance ledger. No Orders source/module scaffold exists; keep initial discovery here until an approved increment merits its owning module spec/tracker.

## Proposed first outcome

Recommend one backend increment, **OR-01: record and read an order submitted at the counter**, with one or more configured Menu selling units and positive line quantities. Recommend takeaway first to avoid assuming table/session/service-charge rules. This mode and scope are proposals, not confirmed restaurant requirements.

No server-persisted cart, UI, kitchen dispatch or payment is needed to demonstrate initial capture. Later order amendments/cancellation/fulfilment/billing are separate discovery, not claims of optional product behavior. The first increment is not a usable end-to-end POS or fiscal sale.

## Existing capabilities and gaps

Indexes/contracts reviewed: [Menu](../../../apps/api/src/modules/menu/docs/README.md), [Authentication](../../../apps/api/src/modules/authentication/docs/README.md), [Business](../../../apps/api/src/modules/business/docs/README.md). Existing source searches found no Orders module, public order operations or prior Orders plan.

| Owner / existing capability | Reuse / missing boundary |
| --- | --- |
| Authentication `runAuthorized` | Current staff/admin/session/CSRF/grant checks, trusted installation and active opaque transaction. Call it once per order mutation; no nested access call or extra connection inside callback |
| Business installation context | Business/branch/currency/timezone remain Business-owned; obtain trusted scope through Authentication, not client-selected ownership or duplicated binding checks |
| Menu catalogue/pricing | Reuse existing definition/availability/selection and exact-price rules. Current supported interface exports only MenuModule; HTTP preview is not a supported transactional Orders API |
| Orders capture/persistence | New Orders-owned branch-scoped order, line snapshot and retry semantics; no existing capability to reuse |

Before implementation, specify a narrow supported Menu application operation/provider export that resolves all requested units from one coherent catalogue snapshot in the caller's active transaction. It must not invoke its own authorization, HTTP endpoints or nested transactions, or expose tables/query builders. Existing Menu domain rules stay Menu-owned; adding this consumer contract belongs to OR-01, not a reopening of accepted MN-01. Agree a safe exact-price representation so Orders can multiply quantities without copying Menu's precision registry/parser or relying on floating point.

## Proposed phase P0 and observable acceptance

These are necessary for reliable first capture; all remain proposed pending the decisions below. Use one ordinary transaction and owned records, not a workflow engine/event bus.

| Outcome / why needed | Proposed observation |
| --- | --- |
| Authorized business/branch capture and reads — prevents cross-installation or unauthorized records | Staff/admin policy enforced through existing access; invalid/revoked/grant-denied requests create nothing and foreign order IDs disclose nothing |
| Resolve selected items/variants/extras/combo choices against current Menu — prevents storing client-spoofed or unavailable selections | Valid submission stores server-resolved composition and amounts; inactive, foreign or invalid selections reject atomically |
| Immutable order-time merchandise snapshots — Menu edits must not rewrite captured history | Retain offering/variant/option identities, displayed names, resolved components, quantity, currency/scale and exact unit/line amounts; changing/deactivating Menu later leaves captured lines unchanged |
| Atomic order and lines with a retry key — a lost response must not create duplicate orders | Same scoped key and same request returns the same order; a different request using that key conflicts; concurrent retries create one aggregate; injected failure leaves no partial order/lines |
| Deliberate price-change policy — preview is nonbinding, not proof of customer confirmation | Implement and verify the chosen confirmation/conflict behavior when Menu changes between preview and submission |
| Bounded readback after process restart — makes capture durable rather than memory-only | Read back the same branch-scoped order, snapshots and amounts after a fresh API process, on a separately authorized disposable target |

Before source work, turn this into a bounded spec with request/line/quantity limits compatible with the existing 16 KiB transport, state/error contracts, retry-key scope/retention and focused checks. Persistence/restart/concurrency execution needs separate target-specific permission; none is inherited from Menu. Do not run old Menu acceptance harnesses on the migrated target.

## Decisions required before implementation

1. **First journey:** accept the recommended counter/takeaway capture, or choose dine-in/delivery requirements that materially change the first slice. Confirm that capture/read, without persisted carts, is a useful first backend increment.
2. **Price changes at submission:** recommend requiring explicit reconfirmation of changed monetary amounts rather than silently accepting a new payable amount. Agree the minimal quoted-selection/confirmation contract; offering revision alone does not represent every dependency change. No stored quote framework is assumed.
3. **Tax and sale boundary:** confirm with the business/accountant whether first capture may record merchandise amounts only, with tax explicitly unresolved and no fiscal/payable total, or whether tax-inclusive/exclusive prices and applicable tax snapshots must be settled before order submission. Never interpret unresolved tax as zero/exempt. Billing owns tax/payment calculations; the eventual sale-time fiscal snapshot must have an explicit owner/timing. This discovery establishes no legal applicability, rate, exemption or compliance claim; follow [compliance guidance](../../compliance/README.md) when resolving it.

The first decision also gates terminology/state: a captured order must not imply paid, sent to kitchen or fiscally finalized. Cancellation/amendment requirements must be discovered before that first order becomes operational.

## Deferred scope and next authorization

Phase P1: persistent carts, categories/search UX, customer profiles, table management, delivery integrations, promotional pricing and configurable workflow engines. None is justified for first capture. Kitchen, billing/tax, payments, amendments/cancellation, shifts, inventory and recovery remain later product/release obligations, not waived by this slice.

Next: user selects the first journey, submission price policy and tax boundary, then authorizes a bounded OR-01 specification/contract refinement. Source implementation remains unapproved until the resulting P0 scope/acceptance are reviewed. This planning work performs no installation, database access/migrations, provisioning or deployment. No new incident identified; existing incident reviews remain separate from Menu acceptance/merge.
