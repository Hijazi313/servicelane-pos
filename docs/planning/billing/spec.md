# Full cash settlement — proposed specification

Owning plan: [README](README.md). Status: proposed, unapproved, unimplemented. Progress: [phase tracker](phase-tracker.md). Material choices: [decisions](decisions.md).

## Outcome and phase P0

An authorized counter operator records that cash was received for one captured takeaway order, once, and can recover the committed bill/payment after a lost response. This records an operator assertion; software cannot establish that physical cash changed hands. Proposed full payment only; no partial balance, processor state machine or persisted draft bill.

| ID | Phase P0 / justification | Smallest sufficient behavior |
| --- | --- | --- |
| BP-R01 | Authorize scoped money operations; foreign or revoked access must not disclose or settle orders | Existing staff/admin access, trusted branch/business and verified actor, CSRF/origin for mutations |
| BP-R02 | Establish a trustworthy payable; capture currently stores merchandise only | Orders-owned immutable financial projection plus explicitly approved, revisioned fiscal policy and exact calculation; missing policy blocks settlement |
| BP-R03 | Prevent duplicate or partial financial records after races/timeouts | One bill and one full cash payment per scoped order, atomically persisted with durable retry identity |
| BP-R04 | Preserve financial meaning after configuration changes | Snapshot bill lines, merchandise/tax/payable amounts, policy identity/version, currency/scale, actor/time and settlement result; read by known order ID |
| BP-R05 | Preserve accepted module boundaries | Orders remains captured/immutable; Kitchen dispatch/state remain payment-independent; no current Menu repricing |
| BP-R06 | Make unsupported financial operations explicit | No edit/delete/void/refund or implicit fiscal/printing success; separate history-preserving correction scope before restaurant use |

Scope provenance: the user authorized planning the next smallest increment, not cash-only policy or tax treatment. BP-R01/03/04 follow existing isolation, transaction and financial-history guidance; cash-only/full settlement and the timing below are proposals. See [decision rules](../../decision-making.md) and [cross-cutting requirements](../../modules/README.md).

## Ownership and consistency

- Orders currently owns `OrderSnapshot` with `amountKind: merchandise`, currency/scale, line amounts and merchandise total. [Orders capabilities](../../../apps/api/src/modules/orders/docs/capabilities.md) expose only capture/read/policy and a preparation projection. The preparation projection intentionally strips money and cannot serve Billing.
- Propose a new Orders-owned read operation through `public.ts` and matching Nest provider export. It takes the caller's trusted authorized scope/active transaction and order ID, returns an explicit financial allowlist: order ID/capture time, fulfillment, line positions/quantity, captured sale descriptions/selections needed for bill interpretation, currency/scale and exact unit/line/merchandise totals. No customer name/phone, instructions, retry payload or capture policy by default. Fiscal identity fields needing more data require an explicit decision. No export of OrderStore/rows or foreign table reads.
- Billing calls `runAuthorized` once, reads that projection and the approved configuration in the same active transaction, then writes only its own aggregate/retry data. No nested authorization, extra connection or external I/O. Preserve existing serialization; database uniqueness on business/branch/order remains necessary. Do not mutate Orders to paid or change Kitchen tickets.
- Bill-time tax configuration ownership: propose Business-owned validated installation configuration, with Billing owning calculation and the retained fiscal snapshot. No rate/registration/default is currently established. Resolve scope (business versus branch), revision and validated provisioning path in BP-00; do not add a general settings subsystem.
- Use integer minor-unit strings with captured currency/scale and exact arithmetic; preserve existing 24-digit aggregate ceiling unless a concrete supported calculation requires review. Explicit approved rounding and per-line/aggregate treatment are mandatory. Reject overflow, incompatible currency/scale or unsupported policies before writes; do not truncate or guess.

## Intended operations and failure behavior

These are application semantics, **not approved endpoint contracts**. BP-00 must finish route/DTO/header/size/status/error details under the [REST skill](../../../.agents/skills/rest-api-contracts/SKILL.md) before implementation; no existing route migration is proposed.

1. **Assess payable, without writes:** read the scoped captured order and current approved fiscal configuration; return line/merchandise/tax/payable breakdown and policy revision, or an explicit policy-unresolved failure with no payable amount. Assessment is nonbinding; no cash is recorded. No missing-policy zero-tax fallback. Approved synthetic policy fixtures can prove calculations only, not operational applicability.
2. **Settle:** operator supplies order ID, durable retry key, expected currency/scale, expected payable and fiscal revision from assessment. Server re-reads/recalculates and requires exact match; changed policy/amount conflicts before writes and requires refresh/reconfirmation. Record one immutable bill plus one payment equal to payable, method cash, verified actor/time and retry identity in one commit. Reject zero/nonpositive payable in this slice unless explicitly approved with semantics. Do not accept client tax totals, branch, actor, paid state or arbitrary payment amount. Cash tender/change remain excluded pending D01 approval.
3. **Read by known order ID:** reauthorize, return no bill if unsettled, otherwise return the committed immutable bill and full payment result. A lost response can be recovered here before another attempt. No growing list/search endpoint is needed.

Proposed retry semantics: required body UUID key, scoped to business/branch and settlement operation, normalized request includes order ID, expected amounts/currency/scale and fiscal revision. Same key/content replays the original committed result before current-policy recalculation; changed content conflicts. Different keys racing for one order cannot create a second bill/payment: loser gets an already-settled conflict and recovers through readback. Retain successful identity with financial history; no purge/expiry feature in this slice. Failed transactions leave no successful retry record. Current authorization is required even on replay. Final key syntax/length and safe error mappings belong in BP-00 contract review.

Read representations deliberately select bill ID, scoped order ID, monetary lines/breakdown, fiscal-policy snapshot, settlement time and cash result. Actor attribution stays stored internally unless an approved consumer needs it. No credentials, customer fields or raw persistence exports. Admission must account for Orders' up-to-1 MiB history plus bill overhead, with a concrete response bound and no truncation agreed in BP-00. No new Orders capture limit is inferred.

Failures distinguish invalid input, not-found within scope, denied access, unresolved fiscal policy, stale assessment, retry-content conflict, already-settled, capacity/overflow and unavailable persistence. All fail without partial settlement. HTTP translation uses shared DTO/envelope/Problem Details/correlation with no-store and safe diagnostics; domain/application remain HTTP-independent. No logs of financial request bodies, customer content or secrets. Exact protocol remains proposed, not available.

## Acceptance criteria

All evidence below is future work requiring its own authorization; none has run for Billing.

| ID | Observable acceptance | Required evidence |
| --- | --- | --- |
| BP-A01 (R01) | Staff/admin can assess/settle/read only trusted scope; absent/foreign IDs indistinguishable; revoked/denied/CSRF-invalid requests reveal/write nothing; client actor/scope rejected | Focused application/HTTP checks; bounded persistence isolation later |
| BP-A02 (R02) | Missing policy produces no payable/settlement; approved synthetic inclusive/exclusive or explicitly non-applicable cases calculate exact approved breakdown; rounding edge, overflow and currency mismatch reject or calculate as specified | Deterministic independent money examples approved in BP-00; no legal applicability inference |
| BP-A03 (R02/03) | Stale assessment/policy revision rejects without bill/payment/retry; refreshed confirmed values settle the full positive payable once | Focused contract/application cases plus later persistence readback |
| BP-A04 (R03) | Same-key replay after lost response returns identical saved outcome even after policy change; changed request conflicts; two keys for one order cannot duplicate payment; injected mid-write failure leaves nothing | Focused offline cases and separately authorized real concurrency/rollback proof |
| BP-A05 (R04) | Known-order read after fresh API process returns exact original bill/payment despite Menu/config changes; attribution and monetary identity survive; never reprice history | Bounded fresh-process persistence/API case; not crash/backup recovery |
| BP-A06 (R05) | Settle with no ticket, queued ticket or ready ticket with identical financial rules; order snapshot and Kitchen state unchanged; dispatch remains independent | New consumer boundary checks only; reuse accepted Orders/Kitchen evidence, no reruns of accepted suites/harnesses |
| BP-A07 (R04/06) | Maximum supported bill admitted or atomically rejected at documented bound; no customer/secret leakage; amendment/refund/delete/print operations cannot silently alter history or report success | Focused projection/serialization/negative API checks; physical receipt output remains unverified |

## Release limits

No fiscal invoice/receipt or tax compliance claim follows from a bill detail response. No print delivery, cash balancing, collection/completion, stock effects, recovery readiness or complete trading-flow acceptance. Corrections/refunds, pre-settlement order cancellation, fiscal applicability/output and retained-history/access policies are material later scope before affected restaurant operation, not conveniences silently classified P1. Keep Kitchen's [accepted operational deferrals and composed evidence](../../../apps/api/src/modules/kitchen/docs/features/preparation/phase-tracker.md#user-acceptance-and-closeout--2026-10-25) unchanged.
