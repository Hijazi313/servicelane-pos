# Full cash settlement — proposed specification

Owning plan: [README](README.md). Status: development recommendations approved; settings and HTTP contract design complete for review; fiscal mode/source authorization pending; unimplemented. Progress: [phase tracker](phase-tracker.md). Material choices: [decisions](decisions.md).

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

The application semantics below are refined by the [BP-00 HTTP contracts](#bp-00-http-contracts--2026-10-26). Design is complete for review; contracts are unimplemented, with source permission and fiscal mode still pending. No existing route migration is proposed.

1. **Assess payable, without writes:** read the scoped captured order and current approved fiscal configuration; return line/merchandise/tax/payable breakdown and policy revision, or an explicit policy-unresolved failure with no payable amount. Assessment is nonbinding; no cash is recorded. No missing-policy zero-tax fallback. Approved synthetic policy fixtures can prove calculations only, not operational applicability.
2. **Settle:** operator supplies order ID, durable retry key, expected currency/scale, expected payable, fiscal revision and Business display revision from assessment. Server re-reads/recalculates and requires exact match; changed policy/amount conflicts before writes and requires refresh/reconfirmation. Record one immutable bill plus one payment equal to payable, method cash, verified actor/time and retry identity in one commit. Reject zero/nonpositive payable in this slice unless explicitly approved with semantics. Do not accept client tax totals, branch, actor, paid state or arbitrary payment amount. Cash tender/change remain excluded under approved BP-D01.
3. **Read by known order ID:** reauthorize, return no bill if unsettled, otherwise return the committed immutable bill and full payment result. A lost response can be recovered here before another attempt. No growing list/search endpoint is needed.

Proposed retry semantics: required body UUID key, scoped to business/branch and settlement operation, normalized request includes order ID, expected amounts/currency/scale, fiscal revision and Business display revision. Same key/content replays the original committed result before current-policy recalculation; changed content conflicts. Different keys racing for one order cannot create a second bill/payment: loser gets an already-settled conflict and recovers through readback. Retain successful identity with financial history; no purge/expiry feature in this slice. Failed transactions leave no successful retry record. Current authorization is required even on replay. Exact key shape and safe error mappings are defined in the BP-00 HTTP contracts below.

Read representations deliberately select bill ID, scoped order ID, monetary lines/breakdown, fiscal-policy snapshot, settlement time and cash result. Actor attribution stays stored internally unless an approved consumer needs it. No credentials, customer fields or raw persistence exports. Admission must account for Orders' up-to-1 MiB history plus bill overhead, with the exact envelope bounds and no-truncation rules defined below. No new Orders capture limit is inferred.

Failures distinguish invalid input, not-found within scope, denied access, unresolved fiscal policy, stale assessment, retry-content conflict, already-settled, capacity/overflow and unavailable persistence. All fail without partial settlement. HTTP translation uses shared DTO/envelope/Problem Details/correlation with no-store and safe diagnostics; domain/application remain HTTP-independent. No logs of financial request bodies, customer content or secrets. The exact protocol is defined below, proposed and unavailable.

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

Design defined at the user's request for configurable tax/pricing and restaurant details. Concrete defaults below are recommendations for this development increment, not verified fiscal obligations or approval to operate. No legal-entity module. No implementation or endpoint is activated.

### Billing policy

One Billing-owned policy per trusted business, used by its currently bound branch. No client-selected ownership, branch overrides, per-order overrides or future branch-management feature. Administrators configure it; staff can read it for assessment. The current role model has no distinct owner role: an owner uses an administrator account.

| Field | Allowed values / validation | Initial value / meaning |
| --- | --- | --- |
| `taxTreatment` | `unconfigured`, `taxable`, `noTax`; `noTax` requires an explicit applicability decision, never an automatic fallback | `unconfigured`; no payable calculation or settlement |
| `taxLabel` | Trimmed plain text, 1–80 Unicode code points, no control characters; required for `taxable`, otherwise null | null; no jurisdiction-specific label |
| `taxRatePercent` | Canonical decimal string 0–100 inclusive, up to four fractional digits; no exponent/sign/leading zeroes/trailing fractional zeroes; required for `taxable`, otherwise null | null; no rate default. Zero-rated taxable treatment remains distinct from `noTax`. The bound is supported calculation capacity, not a legal rate limit |
| `priceTaxMode` | `inclusive` or `exclusive`, required for `taxable`; otherwise null | null; administrator must state the meaning of captured Menu prices |
| `taxRounding` | `halfUp` or `halfEven`; exact integer/rational arithmetic, ties resolved by selected rule | `halfUp`, an explicit engineering recommendation that must match confirmed fiscal policy before operational use |
| `configurationNote` (write metadata) | Trimmed plain text, 1–500 Unicode code points, no control characters; required on every policy replacement, including explicit `noTax` selection | No policy default; stored internally with actual changes, not returned as an effective calculation setting or proof of accountant/legal approval |

Reject unknown fields, invalid combinations and null/missing required values atomically. For a complete policy replacement, all five effective settings and nonempty configurationNote are explicit, plus expectedRevision. Null clears only effective fields permitted to be null; the note is never null on a write. Initial server state has no change note. `unconfigured` requires null label/rate/mode. Switching back to it blocks new assessments/settlements without affecting old bill reads or successful authorized retry replay. A configuration note is required for that change too. No free-form formulas, arbitrary tax scripts, cascading taxes or hidden production defaults.

Scope limit: one rate/treatment for the whole order in BP-01. Mixed item tax categories, exemptions per item/customer, compound taxes, method-dependent tax and effective-dated policy scheduling are unsupported; an installation requiring them cannot use this slice for affected sales. Do not silently apply the single rate to unsupported cases. These are future requirements to investigate, not a claim that one rate covers most customers.

### Exact calculation rules

Round tax **once per captured order line**, after quantity multiplication; sum rounded line values. No configurable rounding-stage switch, cash rounding, discount or service-charge engine in this slice. `halfUp` rounds an exact half toward the larger nonnegative integer; `halfEven` resolves ties to the even integer. Currency precision comes from the captured currency/scale and existing supported precision registry, not an administrator-selected scale.

Let M be the captured line amount in minor units and r the exact percent. Exclusive: line tax = round(M × r / 100), line net = M, line payable = M + tax. Inclusive: line tax = round(M × r / (100 + r)), line payable = M, line net = M − tax. Explicit `noTax`: line net/payable = M, line tax = 0, with that treatment retained. The captured merchandise amount stays M in every case; never rename it to pre-tax net when prices are inclusive. Bill totals are sums of corresponding line fields; reject overflow under the existing proposed 24-digit bound before any write.

Illustrative development data only: M=1,000 minor units, sample rate 10% gives exclusive tax 100/payable 1,100; inclusive tax 91/net 909/payable 1,000. At M=5 and sample rate 10% exclusive, exact tax is 0.5: halfUp yields 1, halfEven yields 0. These examples specify intended arithmetic; no tax rate or synthetic runtime mode is approved by including them.

### Existing restaurant settings and fixed boundaries

Reuse Business-owned `business.name` and `branch.name` (required trimmed 1–120 code points), optional `branch.address` (1–500), validated currency and timezone. No default restaurant identity, address, registration number or new duplicate `restaurantName` setting. Existing values are the source; missing optional address stays absent. Billing snapshots those display details at settlement through a supported Business interface in the same authorized transaction. Business currently has provisioning/context capabilities, not an admin profile-edit API. Propose a narrow Business-owned administrator update for these existing name/address fields, using expected revision, trusted scope, CSRF and retained actor/time; staff read only. Names have no defaults beyond provisioned values; optional address can be explicitly cleared. Display revision starts at 0 for provisioned values, increases on actual changes and stays unchanged for an identical current-revision replacement. Optional address uses null to clear, with absence in stored/read display projection. Concurrent/stale changes conflict. Currency/timezone are read-only in this increment. Billing consumes a supported transactional display projection and never edits foreign tables. This is a documented source-scope addition, not an existing capability.

Cash-only/full-positive-payment, exact-received semantics, no correction/refund operations and no physical/fiscal receipt output remain workflow boundaries, not pretend configurable switches. No payment-method list containing unsupported integrations. No configurable financial-history deletion, retry safety, authorization bypass or rounding precision. Later methods/categories can extend explicit contracts when their workflows are justified.

### Change control and history

Server owns `revision` (initial effective configuration revision 0 for unconfigured state), trusted business ID, verified actor ID and UTC change time; clients cannot supply those as configuration values. Every accepted replacement requires `expectedRevision`; stale writes conflict with no change. An identical normalized replacement of effective values at the current revision is a no-op, even if the submitted note differs; no revision/audit event is added for note-only changes. Actual changes increment revision once and retain old/new policy plus actor/time/note. No-op requests using an old revision still conflict. Writes use current administrator/session/grant/CSRF authorization in the existing transaction; staff cannot edit policy.

Changes take effect immediately for subsequent assessments/settlements, including previously captured but unpaid orders. An assessment is nonbinding: settlement requires its policy revision, Business display revision and expected totals, and conflicts after a policy change. Completed bills retain the exact policy revision/values, Business display revision/snapshot and monetary breakdown; replays return the original result even if settings later change. Retain configuration history with financial records; no deletion/retention control in BP-01. Updating settings is not permission for operational use: fiscal applicability, receipts/corrections and release gates still apply.

### Configuration acceptance

| ID | Required future observation |
| --- | --- |
| BP-A08 | Initial unconfigured policy blocks payable/settlement; explicit taxable/noTax combinations validate; malformed/unknown/unsupported values fail atomically; zero-rated remains distinguishable from noTax |
| BP-A09 | Staff edits to billing and Business display settings denied; current administrator change records server actor/time and one revision; concurrent/stale writes conflict; old bills and authorized successful replays keep original policy/display details |
| BP-A10 | Approved independent examples cover inclusive/exclusive, both rounding ties, multiple quantities/lines, total reconciliation and overflow; absent settings never become zero tax; unsupported mixed-tax workflows are outside availability |

Evidence remains pending: documentation/source inspection only in this task, no executed calculation, API, database or runtime checks. The following contracts define transport/representation/capacity; fiscal mode and explicit source authorization remain required before BP-01.

## BP-00 HTTP contracts — 2026-10-26

Contract status: **design complete, awaiting owner acceptance/fiscal-mode decision**. Delivery: **unimplemented**. No executable schema exists yet; the field definitions below are the canonical planned contract until approved source DTOs/results replace their structural definitions. Common rules apply to every listed operation, followed by operation-specific differences.

### Routes and admission

| Method / path | Owner / policy | Request | Success data / status |
| --- | --- | --- | --- |
| GET `/api/v1/billing/policy` | Billing / staff | No body contract | PolicyView / 200, including virtual initial unconfigured revision 0; GET never inserts defaults |
| PUT `/api/v1/billing/policy` | Billing / administrator | PolicyReplacement | Current PolicyView / 200, including supported no-op |
| POST `/api/v1/billing/assessments` | Billing / staff | `{orderId}` | AssessmentView / 200; no assessment ID, Location, persisted draft, bill/payment or retry record |
| POST `/api/v1/billing/bills` | Billing / staff | SettlementRequest | BillView / 201 on creation and exact replay; Location `/api/v1/billing/orders/<orderId>/bill` |
| GET `/api/v1/billing/orders/:orderId/bill` | Billing / staff | UUID orderId path | Original BillView / 200; no bill gives BILL_NOT_FOUND, including captured/unsettled, absent or foreign orders |
| GET `/api/v1/business/display-settings` | Business / staff | No body contract | DisplayView / 200, scoped to the current bound business/branch |
| PUT `/api/v1/business/display-settings` | Business / administrator | DisplayReplacement | Current DisplayView / 200, including supported no-op |

Staff policy includes current administrators under the accepted Access behavior; no new cashier/owner role. Trusted installation and current grants/session/account checks use the existing Access boundary. All POST/PUT require its approved origin and CSRF proof; GETs preserve current HTTPS/authority/origin/session checks without a new CSRF requirement. All routes reject every query key, including duplicate/unexpected scalar values. No lists, filters, cursors or pagination. GET has no request-body contract; do not add a generic body detector as incidental work.

Assessment is deliberately POST: `runAuthorized` requires CSRF and touches session activity even when its callback only reads. The callback creates no Billing/Orders/Business records; the existing Access session touch is technical activity, not a sale. A GET assessment would require a new Authentication read-transaction contract; that extension is excluded. Repeating assessment is safe but can produce changed values after configuration changes. In its one authorized transaction, assessment checks scoped existing settlement first (ORDER_ALREADY_SETTLED), then scoped Orders projection (ORDER_NOT_FOUND), source/currency consistency, configured policy, positive exact calculation and both capacity admissions. It reads policy and Business display in that transaction and returns their coherent revisions; it writes no successful retry identity.

### Common input, output and limits

- JSON POST/PUT require `application/json`, UTF-8 with optional charset. Existing global request body limit is 16,384 bytes; do not raise it. Unsupported media 415, malformed JSON 400 and oversized body 413 follow adapter/shared-boundary limits below. No strict Accept negotiation is added; ordinary JSON and Problem Details follow existing behavior.
- Bind concrete runtime body/path DTO classes through DtoValidationPipe; EmptyQueryDto on every route. Reject implicit scalar conversion, unknown fields, extra nested fields, duplicate scalar query parameters, array/object substitutions and omitted/null required values. Duplicate JSON property detection is not guaranteed by the existing parsed-body pipe; no custom parser is added. Keep application/domain normalization/invariants for non-HTTP callers. IDs accept the existing case-insensitive hexadecimal `8-4-4-4-12` UUID shape and normalize lowercase; no new version/variant constraint is imposed.
- Money is a canonical unsigned base-10 integer string: `0` or a nonzero leading digit followed by at most 23 digits. No sign, leading zeroes, decimal point, exponent or numeric JSON value. Expected payable must be positive. Currency is a three-letter uppercase string matching captured and bound configured currency; scale is a JSON integer 0–4 matching captured supported precision. No admin-selected precision or floating point conversion.
- Revisions are JSON integers 0–2,147,483,647. Any actual edit at maximum revision fails REVISION_CAPACITY before writes; an identical current-revision replacement remains a no-op. Initial Billing revision 0 is virtual until a first actual change; Business display revision 0 covers the provisioned bound tuple. Do not lazily write on GET.
- Every ordinary success is `{data: <defined view>, meta: {requestId}}`, `application/json`, server X-Request-Id matching meta, Cache-Control no-store. IDs are opaque lowercase UUIDs; instants are UTC ISO 8601 with millisecond precision. Optional absence is documented per field below; no other fields are exposed. Replay returns original data with the current request's requestId.
- AssessmentView and BillView each have a **2,097,152-byte** UTF-8 serialized success-envelope cap; PolicyView/DisplayView each have a **16,384-byte** envelope cap. Errors use the existing shared safe bounded details, never whole source records. Technical caps are not configurable restaurant policy.
- Before returning assessment, admit both its serialized view and its prospective final BillView. Before committing settlement, admit the exact final view including UUID bill ID, 24-character timestamp, singular payment and 36-character requestId reservation. Never truncate, silently lower Orders limits or claim all accepted Orders necessarily fit. A response-capacity failure commits no bill/payment/retry; accepted historical read/replay must remain within the same versioned representation bound. No postcommit representation growth is introduced by this contract.

### Exact write shapes

**PolicyReplacement** has required `expectedRevision`, the five effective policy fields `taxTreatment, taxLabel, taxRatePercent, priceTaxMode, taxRounding`, and `configurationNote`. Definitions/defaults/conditional nulls are in the settings table above. The note is write-only audit metadata, excluded from effective policy comparison and staff responses. Normalize trimmed label/note; canonical rate syntax must already match the table. Reject incompatible combinations atomically. PUT is full replacement of effective settings, not PATCH; omission never means preserve.

**DisplayReplacement** has exactly `{expectedRevision, businessName, branchName, branchAddress}`. Names are required trimmed 1–120 Unicode code points without control/surrogate characters; branchAddress is required as either null (clear) or trimmed 1–500 code points under the same text rule. Reuse Business validation. No currency/timezone/IDs/actor/profile extension fields. One revision identifies the complete bound `(business.name, branch.name, branch.address)` tuple; any actual change increments it once. HTTP address is always string or null; internal Business projection may omit absent address. Initial display revision/history storage is a new Business prerequisite, not an existing field. Actual changes retain old/new tuple and verified actor/time in Business-owned history; no history-list API.

**SettlementRequest** has exactly these required fields:

| Field | Definition |
| --- | --- |
| `orderId` | UUID of a captured order in trusted current branch |
| `retryKey` | UUID generated once per logical settlement; normalize lowercase; required body key only, no Idempotency-Key header contract |
| `expectedCurrencyCode` | Captured uppercase currency code from assessment |
| `expectedScale` | Captured numeric scale from assessment |
| `expectedPayableMinor` | Positive canonical minor string, at most 24 digits |
| `expectedPolicyRevision` | PolicyView revision from assessment |
| `expectedDisplayRevision` | DisplayView revision from assessment |

No method, tendered/change amount, tax totals, state, business/branch/actor, collection flag or print proof. Selecting this cash-only operation means operator assertion of full exact cash receipt. Do not infer physical receipt of money from success. No payment-processor call or external I/O.

### Exact public views

**PolicyView**: exactly `{revision, taxTreatment, taxLabel, taxRatePercent, priceTaxMode, taxRounding}`. Label/rate/mode are explicit null for unconfigured/noTax; rounding is always an enum. Initial view is revision 0, unconfigured, three nulls and halfUp. No note/actor/change timestamp or legal-approval flag. `taxable` with rate `0` remains distinguishable from `noTax`.

**DisplayView**: exactly `{revision, businessName, branchName, branchAddress, currencyCode, timezone}`. Address is string or null; currency/timezone are current Business-validated read-only values. Bill-time display includes these values at settlement, not a live join.

**BillingLine**: exactly `{position, quantity, sellingUnit, unitMerchandiseMinor, merchandiseMinor, netMinor, taxMinor, payableMinor}`. Position is stable zero-based captured line index (0–499); quantity is the captured integer 1–1,000. Monetary fields use common minor-string syntax; unitMerchandiseMinor includes captured options/extras already priced by Menu—never add them twice. `sellingUnit` is an explicit captured allowlist:

- `{offeringId, name, components, addOns, choices}`; no live Menu data or source policy/request/customer/instructions.
- Each component is `{itemId, itemName, variantId, variantName, quantity}`; component quantity is per selling unit, not multiplied again into line money. This preserves captured size/variant distinctions.
- Each add-on is `{id, name}`; each choice is `{groupId, optionId, name}`. Retain source order/duplicates where meaningful. Source names/array bounds are those accepted in Orders' stored Menu resolution; do not reinterpret or allow client-supplied composition. The aggregate 2 MiB cap also applies. Nested source surcharges/selection request are not exposed; captured unit/line amounts are authoritative.

**AssessmentView**: exactly `{orderId, capturedAt, fulfillment, currencyCode, scale, businessDisplay, taxPolicy, lines, merchandiseMinor, netMinor, taxMinor, payableMinor}`. Fulfillment is `takeaway`; businessDisplay is DisplayView; taxPolicy is PolicyView. Lines retain captured order, 1–500 entries. Totals sum corresponding line fields. Assessment has no bill ID/payment/settledAt/status/expiry token. If the order is already settled, return ORDER_ALREADY_SETTLED and recover via saved-bill GET; never calculate a second current-policy payable.

**BillView**: exactly AssessmentView's fields frozen at settlement, plus `{id, settledAt, payment}`. Payment is exactly `{method: "cash", amountMinor}`, where amountMinor equals bill payable and is positive. Bill ID identifies the one settlement aggregate; no independent payment ID/state/timestamp is justified for its singular atomic payment. Settlement time/actor belong to that whole event; verified actor remains internal. No paid/printed/fiscalized/collected flags, receipt number, raw retry key/request, configuration note, staff profile, customer contact/instructions or ownership/persistence rows.

### Financial and persistence invariants

Parse rate exactly into integer units u with 1% = 10,000 units. Exclusive fraction is `M*u/1,000,000`; inclusive fraction is `M*u/(1,000,000+u)`. Use arbitrary-precision integer intermediates, quotient/remainder rounding once per line, then sum. Do not cap intermediate multiplication to 24 digits; cap every stored/public monetary result. Validate source amountKind=merchandise, captured/takeaway state, supported currency/scale, positive bounded quantities, unit × quantity = line amount and sum of line amounts = captured total. Corrupt/inconsistent source fails closed as internal error, with safe diagnostics, not client validation or a guessed payable. For every line/bill, net + tax = payable. Zero total payable is unsupported in this slice and fails before writes.

New settlement requires captured currency/scale compatible with current Business configuration; old read/replay uses saved currency without re-resolving current policy/Menu/Business. No import of Menu's internal precision table or foreign persistence. Orders' billing projection validates captured supported monetary identity behind Orders public.ts, returns a narrow typed result and never reprices; Business supplies current supported context/display behind its public interface. These operations and matching Nest provider exports are source prerequisites. Preparation projection remains unchanged.

Billing owns one immutable settlement aggregate containing bill, singular payment, normalized successful request and internal verified actor/time. Atomic unique identities are `(businessId, branchId, orderId)` and `(businessId, branchId, retryKey)`. No successful key or partial aggregate survives rollback. Separate payment tables/general ledger/outbox are not required for this cash-only outcome. Source migrations may add integrity constraints but are not executed by planning/source permission.

In one `runAuthorized` staff transaction, after structural normalization:

1. Find successful retry under trusted business/branch/key. Same normalized request returns original saved BillView without current order/config/amount recalculation, including when policy is now unconfigured. Different normalized request returns SETTLEMENT_RETRY_CONFLICT without disclosing original order/result. Normalize UUID casing; compare all seven request fields, including both revisions. Request key maps to its retained outcome; no failure outcome is retained.
2. With no successful key, find settled bill under trusted order identity. If found, return ORDER_ALREADY_SETTLED regardless of current policy. Do not attach a second successful key or cash payment; read via canonical known-order route.
3. Read the Orders financial projection, current Billing policy and Business display through the same opaque transaction. Missing/foreign order is ORDER_NOT_FOUND. Validate source and currency compatibility; require configured policy (BILLING_POLICY_UNCONFIGURED takes precedence over stale revisions if policy was reset). Compare both revisions before recalculation/expected currency/scale/payable comparison. Any changed expectation is STALE_ASSESSMENT; no partial bill/retry. Policy/display changes after assessment require refresh even when payable happens to match.
4. Compute exact breakdown, validate positive payable/overflow/capacity, generate server identity/time, then persist the complete aggregate and successful request together. Await all work; commit failure is failure, never a success response.

Current installation authorization serialization makes concurrent in-flight callers wait; no async pending payment/202/retry polling API. Same-key waiters then replay/conflict; different-key same-order waiters see already-settled. Database uniqueness remains a backstop, not a SELECT-then-INSERT claim. If an unexpected uniqueness race escapes current serialization, roll back and return BILLING_UNAVAILABLE; resolve through a subsequent currently authorized known-order GET/original-key request, not an internal blind retry or nested authorization/transaction. If outcome remains unknown, return a safe failure and recover through known-order GET or reuse of the original key. Never generate a new key merely because the network failed.

Billing policy PUT and Business display PUT use the same existing administrator authorized serialization and their own expected-revision compare/update, so settlement sees a coherent winning revision or conflicts. Read-only GET policy/display use current authorized scoped reads (one owning-module query), with no creation of defaults/history. Saved bill GET follows current authorized-context/scoped owned read like Kitchen; it does not fetch global Orders and filter afterward. No Authentication extension or payment prerequisite for Kitchen is introduced.

Setting PUTs have revision safety, not settlement-style durable keys. After a lost response, GET and compare desired effective values/revision; do not blindly resubmit with a new revision. Old expectedRevision conflicts even if content matches. Identical effective values at current revision return unchanged resource with no revision/history increment; policy note alone is not an edit. No audit history deletion/update API.

### Failure mapping and recovery

All marked method semantic failures use root `application/problem+json` with shared title/status, `/problems/<lowercase-kebab-code>`, uppercase code and `meta.requestId`. Only the selected details below are permitted; no raw exception messages, SQL, amounts, customer fields, configuration notes or retry request echoes. Access, framework and unexpected mappings remain shared. Domain/application errors have semantic codes without HTTP status.

| Condition / code | HTTP | Safe details / recovery |
| --- | --- | --- |
| Structural invalid input `VALIDATION_FAILED` | 400 | Existing safe JSON Pointer errors with body/query/path locations; no values echoed |
| Billing domain invalid `INVALID_BILLING_INPUT`; Business domain invalid `INVALID_DISPLAY_SETTINGS` | 400 | No details; correct request |
| `ORDER_NOT_FOUND` on assessment/new settlement; `BILL_NOT_FOUND` on saved read | 404 | No details; absent and foreign indistinguishable |
| `BILLING_POLICY_UNCONFIGURED` | 409 | No details; administrator must configure approved policy |
| `STALE_ASSESSMENT` | 409 | `{policyRevision, displayRevision}` only; reassess and reconfirm |
| `STALE_BILLING_POLICY`; `STALE_DISPLAY_SETTINGS` | 409 | `{revision}` for the caller's current resource only; GET/refresh |
| `SETTLEMENT_RETRY_CONFLICT` | 409 | No details; recover original operation, never repurpose key |
| `ORDER_ALREADY_SETTLED` | 409 | No details; canonical known-order bill GET |
| `BILL_CAPACITY`; `BILL_AMOUNT_OVERFLOW`; `UNSUPPORTED_BILL_CURRENCY`; `UNSUPPORTED_ZERO_PAYABLE` | 409 | No details; no bill/payment/key committed, requires supported scope/request |
| `REVISION_CAPACITY` | 409 | No details; no increment/wrap; requires separately scoped migration, not reset |
| Known owned persistence unavailable `BILLING_UNAVAILABLE`; `DISPLAY_SETTINGS_UNAVAILABLE` | 503 | No fabricated Retry-After; reconcile uncertain settlement by GET/original key |
| Current Access policy failures | Existing 400/401/403/404/409/429/503 as mapped by shared Access policy | Preserve existing challenge/throttling/Retry-After behavior; no separate Billing authorization formatter |
| Unexpected/corrupt source/commit failure not classified as known unavailable | 500 `INTERNAL_ERROR` | Shared safe correlation, no raw diagnostics; uncertain outcome recovered as above |

No intentional success on unsupported refund/edit/delete/print requests. Unmatched routes/methods and adapter parsing/media/size failures can precede method opt-in; preserve the existing documented legacy fallback rather than promise every such failure is Problem Details. Do not add 405/Allow negotiation or migrate old routes as incidental work.

### Wiring, compatibility and design evidence

Source inspected: [bootstrap](../../../apps/api/src/main.ts) already calls createHttpAdapter with the 16,384-byte request cap and completion reporting; [AccessHttpModule](../../../apps/api/src/modules/authentication/http/access-http.module.ts) registers HttpContractGuard before AccessBoundaryGuard, one response interceptor and shared Access fallback. [Kitchen controller](../../../apps/api/src/modules/kitchen/http/kitchen.controller.ts) and [semantic filter](../../../apps/api/src/modules/kitchen/http/kitchen-exception.filter.ts) demonstrate applicable composition. [runAuthorized](../../../apps/api/src/modules/authentication/application/access.service.ts) checks CSRF/touches session; [BusinessService](../../../apps/api/src/modules/business/infrastructure/business.service.ts) has context/bootstrap but no display revision/edit; Orders currently exports preparation only.

At authorized source entry, mark these seven new JSON methods with HttpContract, bind runtime DTOs, compose module semantic filters through existing HttpContractFilter/errorPolicy, and preserve global registration. Billing imports supported Orders/Business/Authentication public providers; Business must not import Billing. No second adapter/guard/interceptor/error framework, automatic response sanitizer or legacy Orders/Kitchen migration. Explicit output allowlists and precommit capacity checks are module responsibilities. Logs use existing request ID/route-template/status metadata, never financial bodies/raw URLs/query values/notes/customer content. No external telemetry or new log retention policy.

Design review covers the REST checklist's input/response selection, status/envelope/headers, trusted scope, revision/retry concurrency, failure recovery and compatibility. Collection/pagination is not applicable; no collection endpoint exists. These are new contracts with no current Billing consumers; accepted Orders/Kitchen contracts/evidence remain unchanged. Executed DTO/HTTP/serialization/authorization/persistence evidence is **unavailable**; no tests/builds/database work performed. Design completeness is not runtime, fiscal applicability, receipt output, user acceptance or restaurant-readiness evidence.

### Additional contract acceptance

| ID | Required future evidence / exit |
| --- | --- |
| BP-A11 | Seven concrete DTO/shared HTTP routes obey method/media/query/body/path validation, exact success views, nulls, Location/replay status, safe Problem Details and adapter fallback limits; no foreign/customer/audit leakage |
| BP-A12 | Both policy/display edits race with settlement: one coherent serial revision wins or stale assessment rejects; note-only no-op, stale same-content update and maximum revision behavior are explicit |
| BP-A13 | Replay after unconfiguration/display/currency changes returns original data under current authorization; revoked session fails; changed revision with same amount conflicts on key; settled assessment never reprices |
| BP-A14 | Line quantity/composition distinctions, line-round-then-sum ties, source corruption, zero payable, overflow and both 2 MiB admission boundaries produce the defined result with no partial financial records; real uniqueness/rollback/fresh-process evidence remains BP-02 |

BP-A01–14 define proposed source acceptance; they do not reopen accepted upstream tests. Source entry must first settle BP-D02 development mode and obtain bounded BP-01 permission. No tax rate, actual applicability or synthetic-only runtime approval is inferred from this contract.
