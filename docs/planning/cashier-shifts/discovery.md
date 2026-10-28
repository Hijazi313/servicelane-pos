# Cashier Shifts — proposed next phase

Status: proposed; scope and business decisions await owner review. Planning authorization: user instruction on 2026-10-28, documentation only. [Global tracker](../TRACKER.md) owns current focus. No source implementation, database/environment access, dependency installation, publication or deployment is authorized.

## Owner review first: walk through one trading day

CS-00 can proceed using the [reference cash workflow and integration comparison](reference-workflow.md); operator confirmation remains a release validation input, not a prerequisite for planning. Decisions explicitly recorded below are confirmed; other recommendations remain proposed. Validate:

1. User confirmed each cashier has a separate drawer on 2026-10-28. Determine how drawers are identified, assigned and handed over, including backup tills and custody; concurrent sessions in the same branch are required. A one-open-session-per-branch constraint is excluded.
2. Who supplies the opening float, and what cash enters or leaves during service: sales, expenses, supplier payments, safe drops or other movements? Use the reference to prepare scope now and validate D01/D03 through this walkthrough before restaurant launch.
3. Who counts and closes in practice? Is an administrator present at closing time? Establish an authorized fallback when the usual closer is unavailable; do not silently grant staff extra authority or force service to depend on an absent administrator.
4. What happens after a mistaken count or attribution is discovered? History-preserving correction rules for both are explicit operational launch blockers. They may remain outside the first backend development increment, but must be resolved, implemented and accepted before affected restaurant use.

Concrete examples for review: an expense of 500 reduces expected drawer cash by 500 and cannot be treated as a shortage; a backup till may need a separate accountability boundary; an absent closer needs an agreed authorized replacement rather than an automatic close.

Review D01–D05 below after this walkthrough. Technical sections are candidate designs for satisfying the agreed workflow, not cash-custody requirements for owner approval.

## Repository baseline

Inspected local `main` at `9cbbb9a` on 2026-10-28. Local history includes Billing PR #17 (`3c4a16b`), documentation checking PR #19 and delivery-skill PR #20. This establishes local integration; remote synchronization was not checked. Eight untracked acceptance ownership ledgers and existing `docs/drafts/` were present and are preserved.

- [Billing capabilities](../../../apps/api/src/modules/billing/docs/capabilities.md) and [accepted closeout](../../../apps/api/src/modules/billing/docs/features/settlement/phase-tracker.md#bp-01bp-02-user-acceptance-and-closeout--2026-10-27): one immutable full-positive-cash settlement per scoped order, durable retry and known-order readback. Accepted development evidence does not establish restaurant readiness.
- Actual [settlement service](../../../apps/api/src/modules/billing/application/billing.service.ts), [store contract](../../../apps/api/src/modules/billing/application/billing-store.ts) and [schema](../../../apps/api/src/modules/billing/infrastructure/schema.ts) store settlement actor/time and amount, but no shift identity, drawer, opening float, count or reconciliation. There is no public settlement collection/projection for Shifts; [Billing public interface](../../../apps/api/src/modules/billing/public.ts) exports only its module. Do not reach into Billing persistence to compensate.
- [AppModule](../../../apps/api/src/app.module.ts) does not mount Billing. Planning a shift integration must preserve this deliberate isolation; source composition and live activation are separate decisions.
- [Access capabilities](../../../apps/api/src/modules/authentication/docs/capabilities.md) provide current staff/administrator authorization and a caller-owned authorized transaction. No cashier-specific role or drawer assignment exists. [Orders](../../../apps/api/src/modules/orders/docs/capabilities.md) and Kitchen own separate workflows; their state must not become a shift-close prerequisite.
- No Cashier Shifts implementation or owning module documentation was found in the module exports/source search. Keep this discovery in global planning until the module is justified; do not scaffold an application module for a proposal.

The global tracker still describes Billing integration as pending, whereas local Git contains its merge. The module overview's Billing paragraph also retains an earlier unverified status. These summaries are reconciled in this documentation change; historical evidence and authorizations remain intact.

## Recommended outcome

First agree a branch cash-session model, then deliver one bounded backend increment: open with a declared float, attribute every new cash settlement exactly once, count and close with a saved variance, and recover the committed result after a lost response. A shift is a cash-accountability period, not an employee attendance record or a calendar day.

On 2026-10-28 the user confirmed separate drawers, handover, cash movements, configurable closing authority and an open-drawer requirement for new cash payments. Details below distinguish those decisions from unapproved mechanisms and remaining choices.

Recommend **CS-00 — scope and contract preparation** as the immediate next phase. Develop the reference workflow and candidate contracts while operator assumptions remain visible; do not recommend independent implementation until scope, closure authority, movements, Billing compatibility and a defensible transaction design are agreed. Prepare canonical module documentation under the applicable REST skill before seeking source activation.

## Proposed phase P0

These are necessary for this bounded outcome if approved, not a claim that the entire restaurant MVP becomes complete.

| ID | Proposed requirement and why it belongs now | Simpler alternative / consequence of deferral | Observable acceptance |
| --- | --- | --- | --- |
| CS-R01 | Branch-scoped drawer sessions with nonnegative opening float, Business currency/scale and verified opener/time; multiple drawer sessions may be open concurrently | Separate cashiers have separate drawers by user direction; independent balances cannot be achieved by a single shared branch session | CS-A01 |
| CS-R02 | New settlements require the intended open session; Billing payment and a minimal shift cash entry commit together exactly once | Time-window or actor-based reporting cannot reliably assign a payment racing with close; no after-commit callback | CS-A02, CS-A03 |
| CS-R03 | Close records actual counted cash, expected cash and signed variance; final state and attribution are immutable | A close flag without a count cannot establish reconciliation; mandatory zero variance would hide real shortages | CS-A04 |
| CS-R04 | Durable mutation retry identity, scoped readback and serialized close/settle/open races | A timeout must not open two sessions, close twice or add cash twice; existing Access transactions are the starting point | CS-A01–CS-A05 |
| CS-R05 | Current access checks, configurable closing authority, minimal staff attribution and business/branch isolation on every action/replay | Existing staff/admin roles are insufficient to express a narrower designated replacement; design a scoped permission without assuming a generic permission designer | CS-A05 |
| CS-R06 | Retain closed reconciliation and historical settlement association without repricing or reassignment | Recomputing from today's policy or editing a closed count destroys the original accountability record | CS-A03, CS-A04, CS-A06 |
| CS-R07 | Cash-in/out with amount, reason, verified actor and time | User confirmed movement support; without it safe drops or expenses make reconciliation wrong. Precise authorization and bounds remain open | Movement retry, close-race and reconciliation scenarios to be specified in CS-00 |
| CS-R08 | Handover transfers responsibility for an open drawer without silently losing prior attribution | User confirmed handover; counting, acknowledgment and unavailable-operator procedure require a reviewed contract | CS-A07 |
| CS-R09 | Restaurant-configurable authority supports self-close and administrator/designated-replacement close | User confirmed both possibilities; per-restaurant policy and narrowly scoped replacement semantics require design | CS-A08 |

## Decisions for owner review

All recommendations below are **proposed**, including apparently convenient defaults. Approval of a business choice does not activate implementation.

| ID | Decision needed | Recommendation and practical consequence | Alternative / scope impact |
| --- | --- | --- | --- |
| CS-D01 | How are separate drawers identified, assigned, selected and handed over? | **Confirmed 2026-10-28:** each cashier has a separate drawer and handover is supported; concurrent drawers are required | Handover protocol, custody, unavailable-cashier recovery and one-open-session-per-drawer safeguard remain proposed; see [reference](reference-workflow.md#reference-day-for-the-first-release) |
| CS-D02 | Who may close? | **Confirmed 2026-10-28:** restaurant settings support cashier self-close and administrator/designated replacement close | Exact settings options/default, permitted combination, replacement designation and scope remain open; Access currently has only staff/admin roles |
| CS-D03 | Are cash movements supported? | **Confirmed 2026-10-28:** support cash movements; propose basic cash-in/out with reason and attribution; expected cash includes them | Confirm authorization and operator practices. Refunds are a separate Billing correction, not a generic cash-out. |
| CS-D04 | What does close do, including overnight sessions and the next float? | Explicit close at any time, including across midnight; no automatic daily close or date-based reassignment. Closing does not mark orders collected or affect Kitchen. Next float is separately declared, with no automatic carry-forward or implied physical payout | Business-day cutoff, cash carry-forward and handover require their own rules; identify mandatory practices now |
| CS-D05 | Does a new cash payment require an open drawer session? | **Confirmed 2026-10-28:** yes. Payment and attribution must commit atomically | The exact Billing contract migration, legacy retry handling and API shape remain to be reviewed; preserve historical bills and successful retries without fabricated sessions |

For review: resolve the remaining D01 details and D02–D05, particularly drawer assignment, movement support and practical closing authority. These are development-scope choices; operational tax, receipts, retention and recovery acceptance remain separate prerequisites.

## Technical design candidates and validation gates

The required invariant is atomic payment/attribution and an unambiguous close boundary. “Billing calls Shifts” is only a candidate dependency direction. Before selecting it, inspect actual Access transaction lifetime, locking order, persistence adapters and Nest composition; establish whether close and settlement can enforce the proposed ordering without nested authorization, circular imports or foreign-table access. Source review establishes feasibility only; later bounded contention evidence must establish behavior.

CS-00 must deliver a concrete Billing compatibility matrix before source activation, covering: historical successful retries with original matching semantics; new requests without a session; requests targeting a closed/replaced session; successful retries after close or a new open; and isolated test composition while Billing remains absent from AppModule. For each, specify request compatibility, admission/result, attribution effects and recovery. There are no confirmed external Billing clients in the inspected evidence; inventory actual callers before claiming compatibility. Apply the REST skill when designing these contracts.

Subject to the decisions above:

- Under candidates A/B, Shifts could own session lifecycle, float/count/variance, retry identities and minimal immutable cash-attribution entries. Candidate C places association with Billing instead. Billing remains authoritative for bills, payment amount and its successful settlement retry. Never copy complete bills, customers, tax configuration or order instructions into Shifts.
- Candidate A has Billing invoke a narrowly exported Shifts capability inside its existing `runAuthorized` transaction; candidates B and C offer different ownership and dependency directions. See the [comparison](reference-workflow.md#integration-evidence-and-candidate-approaches). None is selected. Each must ensure settlement and attribution commit or roll back together and close totals are consistent.
- Do not invoke nested authorization, create another connection, emit an asynchronous attribution event or perform external I/O inside the transaction. Reuse current Access serialization and add persistence uniqueness/integrity backstops. Design explicit close-versus-settlement ordering before implementation: a payment either commits into the open session before close and is included, or fails admission after close; it never lands outside the count.
- A successful original settlement retry returns its original bill under current authorization, even after its session closes or another opens. It must not create another entry or move cash to the new session. An uncommitted request targeting a closed/replaced session conflicts and requires deliberate refresh/reconfirmation. Specify how intended session identity participates in new request normalization without breaking historical successful retry matching.
- Open and close need scoped durable retry identities too: same key/content returns the committed result; changed content conflicts. Closed sessions cannot reopen or accept additional payments. A new key cannot amend a closed count. Unknown outcomes recover with the original key or authorized known-session readback, not a fresh payment key.
- Money uses decimal-safe integer minor-unit arithmetic and explicit capacity limits, never floating point. Opening/count amounts are nonnegative; variance may be negative. Session currency/scale is frozen from validated Business context. Reject a new payment whose monetary context differs; do not change old amounts when business settings change. Set bounds and aggregate-overflow behavior in CS-00, with atomic rejection rather than truncation.
- Use server-resolved business/branch, verified actor and UTC timestamps; Business timezone is for display, not date-window attribution. Do not accept client actor, trusted branch, expected-sales total or variance as authoritative input.
- Read scope: current session discovery for staff; known-session close/readback for authorized administrators. Closed-session search, pagination and end-of-day reports are unnecessary for this first proof. Define a safe no-open state, bounded selected response fields and recovery without retained browser state in the contracts.
- Retain successful retry and cash-history records; no deletion, count editing or reallocation capability in this slice. Correcting a mistaken close is an unresolved operational requirement before restaurant use, not permission to overwrite history. Do not invent a legal retention period. Follow [compliance guidance](../../compliance/README.md); this proposal makes no new legal or fiscal compliance claim.

No routes, payload schemas, error codes or migrations are approved by this discovery document. CS-00 must define them using the REST skill and actual shared HTTP wiring. Keep existing BillView/readback stable unless a separately reviewed consumer need justifies change; the intended-session admission change is explicit scope, not an incidental addition.

## Acceptance examples for the proposed increment

| ID | Requirements | Scenario and expected outcome | Evidence needed later |
| --- | --- | --- | --- |
| CS-A01 | R01, R04 | Separate drawer sessions can open concurrently in the same branch and retain independent balances; same-drawer concurrent-open behavior follows the selected uniqueness rule. Identical retry recovers its session, changed-content retry conflicts; negative/malformed/overflowing float rejected | Focused offline validation plus bounded real-PostgreSQL concurrency/uniqueness |
| CS-A02 | R02, R04 | New cash settlement requires the confirmed open session. Failure between either module's writes leaves neither committed; retry creates one bill and one entry | Cross-module transaction rollback and contention evidence; source review alone insufficient |
| CS-A03 | R02, R04, R06 | Settle races with close: payment is included before closure or rejected afterward. Successful original retry after closure/new open returns the original bill, with no new entry; another key cannot settle the order again | Bounded PostgreSQL race and replay checks, including preserved pre-shift successful retries |
| CS-A04 | R03, R06 | Float 1,000 + payments 5,000 produces expected 6,000; count 5,900 persists variance −100 and required explanation. Zero-sales/zero-float close works; closed records cannot change | Exact arithmetic/permissions offline cases plus persistence/readback; synthetic currency-valid fixtures only |
| CS-A05 | R04, R05 | Revoked/disabled actor, wrong branch/business or a caller disallowed by current close policy cannot read/mutate through direct ID or retry. Lost open/close response is recoverable; opener disablement does not prevent an otherwise authorized close | Current Access integration, synthetic isolation and fresh-process durable readback |
| CS-A06 | R06 | Earlier settled bills remain unchanged/unassigned; later currency/policy changes do not reprice closed history. Payment context mismatch is rejected with no partial state | Migration compatibility review, prior-record digests and bounded synthetic integration evidence |
| CS-A07 | R08 | Handover changes the authorized custodian once, preserves prior actor/session history and does not duplicate cash; retry and a concurrent payment/handover resolve consistently | Focused offline and bounded transaction/concurrency checks after protocol decisions |
| CS-A08 | R05, R09 | Each supported settings mode permits its intended closer and rejects unauthorized others, including revoked replacement access; policy changes apply as specified | Settings/Access integration and transactional authorization evidence after mode semantics are decided |

Reuse accepted upstream evidence after verifying unchanged dependencies. New cross-module cash attribution, migration compatibility, close races and durable recovery require their own evidence. Do not rerun accepted Orders/Kitchen suites merely because the phase changed. Physical cash custody, actual drawer hardware, fiscal receipts and crash/backup recovery are not proved by these tests.

## Phase sequence and review gates

| Phase | Outcome / exit | State and authorization |
| --- | --- | --- |
| CS-00 | Develop a reference workflow and candidate contracts, record operator-validation assumptions, and make scope, HTTP/retry compatibility, transaction options and bounded verification reviewable | Planning authorized; full operator workflow documentation is not a prerequisite. Decisions/contracts remain unapproved; source work needs agreed scope and separate authorization |
| CS-01 | Approved open/attribute/movement/handover/count/close and closing-policy source and migration source, narrow Billing integration, capability indexes and meaningful existing offline checks | Proposed; requires separate source/check authorization after CS-00. No AppModule activation, database execution or installation inferred |
| CS-02 | Separately reviewed disposable-target procedure; bounded synthetic persistence/concurrency/recovery verification and owned cleanup; evidence assessed for user acceptance | Proposed objective only; procedure preparation and execution permissions remain distinct. Never inherit prior one-run database permission |

After CS-01 the intended interface is an isolated backend composition that can demonstrate session-aware full-cash settlement. It is not an operational cashier screen. After CS-02, any backend acceptance remains a user decision; mounting routes and releasing the complete trading flow need separately scoped authorization.

## Deferred scope and release risks

- Phase P1: denominations, blind counts, threshold/approval engines, shift calendars, attendance, exports and dashboards, subject to workflow validation. Multiple drawers and concurrent sessions are required scope, not P1.
- Basic cash movements are now proposed in the reference first release, subject to owner scope approval and operator validation. Refunds/reversals and correction of mistaken reconciliation need a history-preserving design before affected restaurant operation. No generic accounting ledger is proposed.
- Tender/change handling remains outside the accepted exact-received Billing workflow; Shifts does not silently add it. Card/provider integrations, split/partial payments, receipt printing, fiscal applicability, retention, backup/recovery and complete trading-flow acceptance retain their existing release gates.
- No automatic close on logout, account disablement, date rollover or application restart. A restart must preserve open/closed state, but operational recovery assurance needs separately authorized evidence.
- Business owner must confirm drawer assignment and cash practices; developer source work cannot choose financial policy on the owner's behalf. Payment actor attribution alone does not establish physical custody.

## Planning handoff — 2026-10-28

Solo owner: current agent, documentation only. Changed files: this proposal, global tracker and the stale Billing summary in the module index. No application module scaffolding or accepted Billing spec changes. All Cashier Shifts behavior remains unavailable.

Next action: owner reviews the [reference workflow, integration options and compatibility matrix](reference-workflow.md). Continue contract preparation with explicit assumptions while operator validation is pending; resolve material scope and transaction choices before source activation.

Verification: source/export/composition and local history inspection; local path links and whitespace reviewed during initial planning. Heading anchors and external URLs were not automatically checked. No application tests, environment loading, database, dependency, Git mutation or remote action. Existing untracked work preserved. Incident: [INC-20261028-01](../../quality/agent-incidents.md#inc-20261028-01--cashier-planning-omitted-a-concrete-correction-launch-gate); user review pending.
