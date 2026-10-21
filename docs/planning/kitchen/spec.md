# Kitchen handoff — proposed specification

Date: 2026-10-22. Status: proposed, business decisions pending. [Tracker](phase-tracker.md); [decisions](decisions.md); [global tracker](../TRACKER.md).

## Outcome and smallest justified scope

Propose **KT-01: explicitly dispatch one captured takeaway order into a durable branch kitchen queue and advance the whole ticket through preparation to ready**, exposed through the backend only. This is phase P0 for demonstrating a durable Orders → Kitchen handoff, not product MVP completion or permission for restaurant use. The dispatch policy is conditional on KT-D01; payment-first selection blocks this proposal's current entry.

A queue alone would expose work with no reliable completion boundary. Conversely, printers, a screen UI, station routing and line-level scheduling are not needed to prove this backend handoff. Do not add a general event bus, workflow engine or background delivery worker for an in-process transaction.

| Requirement | Phase P0 justification / simpler alternative |
| --- | --- |
| KT-R01: Explicit authorized, duplicate-safe dispatch | An operator decides when a saved order becomes preparation work; automatic capture dispatch is a material alternative awaiting KT-D01. Repeated/lost-response dispatch must not prepare twice. |
| KT-R02: Complete immutable preparation snapshot | A cook needs quantities, variants, extras, combo composition and instructions; names from current Menu could change an accepted order. Full Orders payload unnecessarily discloses customer/financial data. |
| KT-R03: Durable scoped pending queue and single-ticket read | A missed response or reconnect must rediscover committed work. Memory-only state cannot establish the handoff. A bounded pull interface is sufficient; no push transport required. |
| KT-R04: Whole-ticket state with deliberate conflicts | Kitchen must distinguish waiting, started and ready. A single ready boolean loses whether preparation began; richer line/station lifecycles have no current requirement. |
| KT-R05: Preserve Orders meaning and isolation | Kitchen state cannot imply payment, fiscal sale, collection or order amendment. Scope/permission checks must reject unauthorized and foreign data. |

## Source baseline and ownership

Accepted [Orders capabilities](../../../apps/api/src/modules/orders/docs/capabilities.md), [Menu](../../../apps/api/src/modules/menu/docs/capabilities.md), [Authentication](../../../apps/api/src/modules/authentication/docs/capabilities.md) and [Business](../../../apps/api/src/modules/business/docs/capabilities.md) were consulted. Orders [public.ts](../../../apps/api/src/modules/orders/public.ts) exports only OrdersModule. [OrdersService](../../../apps/api/src/modules/orders/application/orders.service.ts) provides capture/read/policy internally; [OrderStore](../../../apps/api/src/modules/orders/application/order-store.ts) stores immutable snapshots with customer and merchandise fields. No dispatch, queue or lifecycle interface exists in those reviewed exports. No Kitchen module/index exists. These are source facts, not new runtime evidence.

Proposed source work must add a narrow Orders-owned application operation and matching public/provider exports. It accepts the existing trusted AuthorizedScope and order ID, reads its own snapshot in that active transaction and returns only the approved preparation projection. Do not export OrderStore, its rows, full OrderSnapshot or HTTP controller as Kitchen's interface; do not re-resolve current Menu. Orders retains identity/history/composition ownership. Kitchen owns the ticket, dispatch metadata, revision and preparation state. Authentication `runAuthorized` owns current session/grant/role/CSRF and transaction coordination; Business remains owner of installation/branch settings. No new business identities or hardcoded restaurant settings.

## Proposed contracts and failure behavior

These are semantic contracts, unavailable and unapproved; final schemas/routes belong to later source work after decisions. No API spelling or implementation is approved by this plan.

- Dispatch takes an existing order ID, not client-supplied preparation content, branch, status or payment proof. One staff-policy authorized transaction calls the Orders projection operation and commits one Kitchen ticket initially queued. All reads/writes are awaited in the same transaction; no nested authorization, extra connection or external I/O. An atomic uniqueness constraint on trusted business/branch/order identity makes one ticket per order. Concurrent repeats or a lost response return the same ticket in its current state without resetting it. Rollback leaves no ticket; captured order remains readable.
- Tickets carry a stable ticket ID, source order ID, server timestamps, actor identity for mutations, revision and an immutable preparation projection. Preserve source line order and stable line position plus full selected composition; do not turn combo components into independently ordered quantities. Make per-unit component quantity versus ordered-line quantity explicit so repeated combos cannot be under/overprepared. A changed/deactivated Menu cannot change dispatched content. Do not copy customer fields or money into Kitchen storage or responses.
- Read one ticket or list the current branch's outstanding queued/preparing/ready tickets, excluding no ready ticket until a separately approved completion/collection boundary exists. Use a bounded page with a stable server ordering and cursor; exhaust pages to reconcile the durable outstanding set after reconnect. Proposed oldest-dispatch-first with ticket ID tie-break; validate bounds/cursor and never silently truncate a ticket. This is repeated current-state reconciliation, not an event stream or a cross-page snapshot promise. A queue may grow until later completion semantics are approved; production operation is blocked on that boundary.
- Status updates require the expected revision and allowed next state. Compare/update atomically: only queued→preparing and preparing→ready. Repeating the already successful target with the immediately preceding revision returns current success without another transition; competing/stale or different requests conflict with current scoped state for refresh. No skipped/backward transition or hidden cancellation. Two staff racing to start produce one transition. Dispatch retries never reset preparing/ready.
- Invalid input rejects before mutation; absent/foreign order or ticket IDs return indistinguishable not-found. Current unauthorized/revoked/branch-denied access fails without disclosing content or writing work. Reuse shared access boundary, keep semantic errors in application/domain and map HTTP status only in HTTP. Bound request/page/response sizes using existing safeguards; reject unsupported fields and avoid instruction/customer data in logs/errors.

## Acceptance criteria

All criteria are proposed and conditional on KT-D01–04. Future evidence must use synthetic data and separately authorized verification; no checks are run by planning.

| ID | Scenario and required observable result | Expected future evidence |
| --- | --- | --- |
| KT-A01 (R01/R05) | Dispatch a captured order under current authorized scope; exactly one scoped queued ticket is committed and the original captured snapshot remains unchanged. Invalid/revoked/grant-denied and foreign-ID requests disclose/write nothing. | Focused API/application checks plus separately authorized persistence isolation case |
| KT-A02 (R01) | Concurrent dispatch, lost-response retry and retry after preparing/ready produce the same one ticket without state reset. Injected failure leaves no partial ticket and the order readable. | Bounded real persistence concurrency/rollback verification, permission pending |
| KT-A03 (R02) | Sized item with extras and repeated combo choices, quantity greater than one, order/line instructions preserve exact captured preparation meaning after Menu rename/deactivation. Customer/financial/policy/retry fields are absent from Kitchen records and responses. | Synthetic projection/API checks; fixture includes personal-looking text only to verify explicit free-text policy, never real customer data |
| KT-A04 (R03) | List multiple pages of queued/preparing/ready tickets, read one and reconcile after reconnect/fresh API process; committed work remains discoverable, ordered and scoped. Oversize pages/cursors/foreign IDs fail safely. | Focused boundary checks and separately authorized fresh-process persistence readback; no crash/backup recovery claim |
| KT-A05 (R04) | Advance queued→preparing→ready; race two revisions, repeat a successful transition and attempt skip/backward/stale changes. One logical transition wins; conflicts require refresh; actor/time/revision are retained. | Focused semantic/API checks plus separately authorized atomic-update concurrency case |
| KT-A06 (R05) | Capture without dispatch creates no ticket; preparation changes do not mutate Orders, Menu, payment/tax or stock. Edit/cancel/delete/replacement requests remain unsupported. | Focused contract/boundary inspection and behavioral checks; if D01 selects automatic dispatch this criterion/spec must first change explicitly |

## Deferred scope and release gates

P1 for this development phase: KDS/browser UI and live push (pull proves the backend handoff), printer/bridge/station routing (no physical output required), partial/line preparation, priorities/ETAs/analytics, multi-branch operation, reprints and generic integration infrastructure. P1 classification here does not settle their MVP necessity.

Amendment/cancellation, completion/collection and payment-ordering are material workflow decisions, not disposable conveniences. They need approved later scope before restaurant use; no implementation is activated here. Customer retention/access policy, fiscal applicability, production TLS, recovery and provisioning remain under existing [compliance guidance](../../compliance/README.md) and accepted upstream evidence limits. No new legal requirement, tax exemption or retention period is asserted. Kitchen ready never means paid, served or fiscally finalized.

## Planning location

Keep this proposal in global planning while no Kitchen source module exists; do not scaffold a module to hold plans. At a separately authorized source entry, move the approved behavior/tracker/decisions into Kitchen-owned docs and leave a transition link here. Capability indexes change only with actual public capabilities; none are added by this proposal.
