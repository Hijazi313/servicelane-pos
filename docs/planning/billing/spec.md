# Full cash settlement — proposed specification

Owning plan: [README](README.md). Status: development recommendations approved; settings design defined, detailed contracts pending; unimplemented. Progress: [phase tracker](phase-tracker.md). Material choices: [decisions](decisions.md).

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

Scope provenance: the user approved the bounded development recommendations, then authorized defining configurable settings/defaults on 2026-10-26; no actual tax policy or implementation is approved. BP-R01/03/04 follow existing isolation, transaction and financial-history guidance; cash-only/full settlement and independent Kitchen timing follow approved BP-D01/03. See [decision rules](../../decision-making.md) and [cross-cutting requirements](../../modules/README.md).

## Ownership and consistency

- Orders currently owns `OrderSnapshot` with `amountKind: merchandise`, currency/scale, line amounts and merchandise total. [Orders capabilities](../../../apps/api/src/modules/orders/docs/capabilities.md) expose only capture/read/policy and a preparation projection. The preparation projection intentionally strips money and cannot serve Billing.
- Propose a new Orders-owned read operation through `public.ts` and matching Nest provider export. It takes the caller's trusted authorized scope/active transaction and order ID, returns an explicit financial allowlist: order ID/capture time, fulfillment, line positions/quantity, captured sale descriptions/selections needed for bill interpretation, currency/scale and exact unit/line/merchandise totals. No customer name/phone, instructions, retry payload or capture policy by default. Fiscal identity fields needing more data require an explicit decision. No export of OrderStore/rows or foreign table reads.
- Billing calls `runAuthorized` once, reads that projection and the approved configuration in the same active transaction, then writes only its own aggregate/retry data. No nested authorization, extra connection or external I/O. Preserve existing serialization; database uniqueness on business/branch/order remains necessary. Do not mutate Orders to paid or change Kitchen tickets.
- Business owns restaurant identity/currency/timezone; Billing owns its business-scoped calculation policy and retained bill snapshot. The configuration definition below supersedes the earlier proposed Business-owned fiscal configuration. No rate/registration or fiscal applicability is inferred; no general settings subsystem.
- Use integer minor-unit strings with captured currency/scale and exact arithmetic; preserve existing 24-digit aggregate ceiling unless a concrete supported calculation requires review. Explicit approved rounding and per-line/aggregate treatment are mandatory. Reject overflow, incompatible currency/scale or unsupported policies before writes; do not truncate or guess.

## Intended operations and failure behavior

These are application semantics, **not approved endpoint contracts**. BP-00 must finish route/DTO/header/size/status/error details under the [REST skill](../../../.agents/skills/rest-api-contracts/SKILL.md) before implementation; no existing route migration is proposed.

1. **Assess payable, without writes:** read the scoped captured order and current approved fiscal configuration; return line/merchandise/tax/payable breakdown and policy revision, or an explicit policy-unresolved failure with no payable amount. Assessment is nonbinding; no cash is recorded. No missing-policy zero-tax fallback. Approved synthetic policy fixtures can prove calculations only, not operational applicability.
2. **Settle:** operator supplies order ID, durable retry key, expected currency/scale, expected payable, fiscal revision and Business display revision from assessment. Server re-reads/recalculates and requires exact match; changed policy/amount conflicts before writes and requires refresh/reconfirmation. Record one immutable bill plus one payment equal to payable, method cash, verified actor/time and retry identity in one commit. Reject zero/nonpositive payable in this slice unless explicitly approved with semantics. Do not accept client tax totals, branch, actor, paid state or arbitrary payment amount. Cash tender/change remain excluded under approved BP-D01.
3. **Read by known order ID:** reauthorize, return no bill if unsettled, otherwise return the committed immutable bill and full payment result. A lost response can be recovered here before another attempt. No growing list/search endpoint is needed.

Proposed retry semantics: required body UUID key, scoped to business/branch and settlement operation, normalized request includes order ID, expected amounts/currency/scale, fiscal revision and Business display revision. Same key/content replays the original committed result before current-policy recalculation; changed content conflicts. Different keys racing for one order cannot create a second bill/payment: loser gets an already-settled conflict and recovers through readback. Retain successful identity with financial history; no purge/expiry feature in this slice. Failed transactions leave no successful retry record. Current authorization is required even on replay. Final key syntax/length and safe error mappings belong in BP-00 contract review.

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

## BP-00 settings and defaults — 2026-10-26

Design defined at the user's request for configurable tax/pricing and restaurant details. Concrete defaults below are recommendations for this development increment, not verified fiscal obligations or approval to operate. No legal-entity module. No implementation or API contract is activated.

### Billing policy

One Billing-owned policy per trusted business, used by its currently bound branch. No client-selected ownership, branch overrides, per-order overrides or future branch-management feature. Administrators configure it; staff can read it for assessment. The current role model has no distinct owner role: an owner uses an administrator account.

| Field | Allowed values / validation | Initial value / meaning |
| --- | --- | --- |
| `taxTreatment` | `unconfigured`, `taxable`, `noTax`; `noTax` requires an explicit applicability decision, never an automatic fallback | `unconfigured`; no payable calculation or settlement |
| `taxLabel` | Trimmed plain text, 1–80 Unicode code points, no control characters; required for `taxable`, otherwise null | null; no jurisdiction-specific label |
| `taxRatePercent` | Canonical decimal string 0–100 inclusive, up to four fractional digits; no exponent/sign/leading zeroes/trailing fractional zeroes; required for `taxable`, otherwise null | null; no rate default. Zero-rated taxable treatment remains distinct from `noTax`. The bound is supported calculation capacity, not a legal rate limit |
| `priceTaxMode` | `inclusive` or `exclusive`, required for `taxable`; otherwise null | null; administrator must state the meaning of captured Menu prices |
| `taxRounding` | `halfUp` or `halfEven`; exact integer/rational arithmetic, ties resolved by selected rule | `halfUp`, an explicit engineering recommendation that must match confirmed fiscal policy before operational use |
| `configurationNote` | Trimmed plain text, 1–500 Unicode code points, no control characters; required when changing financial settings, including explicit `noTax` selection | null while unconfigured; records administrator rationale, not proof of accountant/legal approval |

Reject unknown fields, invalid combinations and null/missing required values atomically. For a complete policy replacement, all six fields above are explicit; null clears only fields permitted to be null. `unconfigured` requires null label/rate/mode. Switching back to it blocks new assessments/settlements without affecting old bill reads or successful authorized retry replay. A configuration note is required for that change too. No free-form formulas, arbitrary tax scripts, cascading taxes or hidden production defaults.

Scope limit: one rate/treatment for the whole order in BP-01. Mixed item tax categories, exemptions per item/customer, compound taxes, method-dependent tax and effective-dated policy scheduling are unsupported; an installation requiring them cannot use this slice for affected sales. Do not silently apply the single rate to unsupported cases. These are future requirements to investigate, not a claim that one rate covers most customers.

### Exact calculation rules

Round tax **once per captured order line**, after quantity multiplication; sum rounded line values. No configurable rounding-stage switch, cash rounding, discount or service-charge engine in this slice. `halfUp` rounds an exact half toward the larger nonnegative integer; `halfEven` resolves ties to the even integer. Currency precision comes from the captured currency/scale and existing supported precision registry, not an administrator-selected scale.

Let M be the captured line amount in minor units and r the exact percent. Exclusive: line tax = round(M × r / 100), line net = M, line payable = M + tax. Inclusive: line tax = round(M × r / (100 + r)), line payable = M, line net = M − tax. Explicit `noTax`: line net/payable = M, line tax = 0, with that treatment retained. The captured merchandise amount stays M in every case; never rename it to pre-tax net when prices are inclusive. Bill totals are sums of corresponding line fields; reject overflow under the existing proposed 24-digit bound before any write.

Illustrative development data only: M=1,000 minor units, sample rate 10% gives exclusive tax 100/payable 1,100; inclusive tax 91/net 909/payable 1,000. At M=5 and sample rate 10% exclusive, exact tax is 0.5: halfUp yields 1, halfEven yields 0. These examples specify intended arithmetic; no tax rate or synthetic runtime mode is approved by including them.

### Existing restaurant settings and fixed boundaries

Reuse Business-owned `business.name` and `branch.name` (required trimmed 1–120 code points), optional `branch.address` (1–500), validated currency and timezone. No default restaurant identity, address, registration number or new duplicate `restaurantName` setting. Existing values are the source; missing optional address stays absent. Billing snapshots those display details at settlement through a supported Business interface in the same authorized transaction. Business currently has provisioning/context capabilities, not an admin profile-edit API. Propose a narrow Business-owned administrator update for these existing name/address fields, using expected revision, trusted scope, CSRF and retained actor/time; staff read only. Names have no defaults beyond provisioned values; optional address can be explicitly cleared. Display revision starts at 0 for provisioned values, increases on actual changes and stays unchanged for an identical current-revision replacement. Optional address uses null to clear, with absence in stored/read display projection. Concurrent/stale changes conflict. Currency/timezone are read-only in this increment. Billing consumes a supported transactional display projection and never edits foreign tables. This is a documented source-scope addition, not an existing capability.

Cash-only/full-positive-payment, exact-received semantics, no correction/refund operations and no physical/fiscal receipt output remain workflow boundaries, not pretend configurable switches. No payment-method list containing unsupported integrations. No configurable financial-history deletion, retry safety, authorization bypass or rounding precision. Later methods/categories can extend explicit contracts when their workflows are justified.

### Change control and history

Server owns `revision` (initial effective configuration revision 0 for unconfigured state), trusted business ID, verified actor ID and UTC change time; clients cannot supply those as configuration values. Every accepted replacement requires `expectedRevision`; stale writes conflict with no change. An identical normalized replacement at the current revision is a no-op; actual changes increment revision once and retain the prior policy plus actor/time/note. No-op requests using an old revision still conflict. Writes use current administrator/session/grant/CSRF authorization in the existing transaction; staff cannot edit policy.

Changes take effect immediately for subsequent assessments/settlements, including previously captured but unpaid orders. An assessment is nonbinding: settlement requires its policy revision, Business display revision and expected totals, and conflicts after a policy change. Completed bills retain the exact policy revision/values, Business display revision/snapshot and monetary breakdown; replays return the original result even if settings later change. Retain configuration history with financial records; no deletion/retention control in BP-01. Updating settings is not permission for operational use: fiscal applicability, receipts/corrections and release gates still apply.

### Configuration acceptance

| ID | Required future observation |
| --- | --- |
| BP-A08 | Initial unconfigured policy blocks payable/settlement; explicit taxable/noTax combinations validate; malformed/unknown/unsupported values fail atomically; zero-rated remains distinguishable from noTax |
| BP-A09 | Staff edits to billing and Business display settings denied; current administrator change records server actor/time and one revision; concurrent/stale writes conflict; old bills and authorized successful replays keep original policy/display details |
| BP-A10 | Approved independent examples cover inclusive/exclusive, both rounding ties, multiple quantities/lines, total reconciliation and overflow; absent settings never become zero tax; unsupported mixed-tax workflows are outside availability |

Evidence remains pending: documentation/source inspection only in this task, no executed calculation, API, database or runtime checks. BP-00 still needs concrete HTTP/schema contracts, response capacity and the fiscal development-mode decision before BP-01 source authorization.
