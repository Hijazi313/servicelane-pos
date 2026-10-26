# Full cash settlement — specification

Owning plan: [README](../../README.md). Status: revised BP-00 design accepted and BP-01 source/offline delivery authorized on 2026-10-26; implementation/evidence status belongs to the tracker. Progress: [phase tracker](phase-tracker.md). Material choices: [decisions](decisions.md).

## Outcome and phase P0

An authorized counter operator records that cash was received for one captured takeaway order, once, and can recover the committed bill/payment after a lost response. This records an operator assertion; software cannot establish that physical cash changed hands. Proposed full payment only; no partial balance, processor state machine or persisted draft bill.

| ID | Phase P0 / justification | Smallest sufficient behavior |
| --- | --- | --- |
| BP-R01 | Authorize scoped money operations; foreign or revoked access must not disclose or settle orders | Existing staff/admin access, trusted branch/business and verified actor, CSRF/origin for mutations |
| BP-R02 | Establish a trustworthy payable; capture currently stores merchandise only | Orders-owned immutable financial projection plus explicitly approved, revisioned fiscal policy and exact calculation; missing policy blocks settlement |
| BP-R03 | Prevent duplicate or partial financial records after races/timeouts | One bill and one full cash payment per scoped order, atomically persisted with durable retry identity |
| BP-R04 | Preserve financial meaning after configuration changes | Snapshot bill lines, itemized charges/taxes and net/payable amounts, policy identity/version, currency/scale, actor/time and settlement result; read by known order ID |
| BP-R05 | Preserve accepted module boundaries | Orders remains captured/immutable; Kitchen dispatch/state remain payment-independent; no current Menu repricing |
| BP-R06 | Make unsupported financial operations explicit | No edit/delete/void/refund or implicit fiscal/printing success; separate history-preserving correction scope before restaurant use |

Scope provenance: the user approved the bounded development recommendations, then authorized defining configurable settings/defaults on 2026-10-26; no operational tax policy is approved; BP-01 source authorization is recorded in the tracker. BP-R01/03/04 follow existing isolation, transaction and financial-history guidance; cash-only/full settlement and independent Kitchen timing follow approved BP-D01/03. See [decision rules](../../../../../../../../docs/decision-making.md) and [cross-cutting requirements](../../../../../../../../docs/modules/README.md).

## Ownership and consistency

- Orders currently owns `OrderSnapshot` with `amountKind: merchandise`, currency/scale, line amounts and merchandise total. [Orders capabilities](../../../../orders/docs/capabilities.md) include capture/read/policy, preparation and the BP-01 financial projection. The preparation projection intentionally strips money and cannot serve Billing.
- Use the Orders-owned financial read operation through `public.ts` and matching Nest provider export. It takes the caller's trusted authorized scope/active transaction and order ID, returns an explicit financial allowlist: order ID/capture time, fulfillment, line positions/quantity, captured sale descriptions/selections needed for bill interpretation, currency/scale and exact unit/line/merchandise totals. No customer name/phone, instructions, retry payload or capture policy by default. Fiscal identity fields needing more data require an explicit decision. No export of OrderStore/rows or foreign table reads.
- Billing calls `runAuthorized` once, reads that projection and the approved configuration in the same active transaction, then writes only its own aggregate/retry data. No nested authorization, extra connection or external I/O. Preserve existing serialization; database uniqueness on business/branch/order remains necessary. Do not mutate Orders to paid or change Kitchen tickets.
- Business owns restaurant identity/currency/timezone; Billing owns its business-scoped calculation policy and retained bill snapshot. The configuration definition below supersedes the earlier proposed Business-owned fiscal configuration. No rate/registration or fiscal applicability is inferred; no general settings subsystem.
- Use integer minor-unit strings with captured currency/scale and exact arithmetic; preserve existing 24-digit aggregate ceiling unless a concrete supported calculation requires review. Explicit approved rounding and per-line/aggregate treatment are mandatory. Reject overflow, incompatible currency/scale or unsupported policies before writes; do not truncate or guess.

## Intended operations and failure behavior

The application semantics below are refined by the [BP-00 HTTP contracts](#bp-00-http-contracts--2026-10-26). The revised design is accepted; isolated BP-01 source availability and executed evidence are recorded in the tracker. No existing route migration is proposed.

1. **Assess payable, without writes:** accept orderId and explicit optionalChargeIds, then read the scoped captured order and current approved fiscal configuration; return line/merchandise/tax/payable breakdown and policy revision, or an explicit policy-unresolved failure with no payable amount. Assessment is nonbinding; no cash is recorded. No missing-policy zero-tax fallback. Approved synthetic policy fixtures can prove calculations only, not operational applicability.
2. **Settle:** operator supplies order ID, canonical optionalChargeIds, durable retry key, expected currency/scale, expected payable, fiscal revision and Business display revision from assessment. Server re-reads/recalculates and requires exact match; changed policy/amount conflicts before writes and requires refresh/reconfirmation. Record one immutable bill plus one payment equal to payable, method cash, verified actor/time and retry identity in one commit. Reject zero/nonpositive payable in this slice unless explicitly approved with semantics. Do not accept client tax totals, branch, actor, paid state or arbitrary payment amount. Cash tender/change remain excluded under approved BP-D01.
3. **Read by known order ID:** reauthorize, return no bill if unsettled, otherwise return the committed immutable bill and full payment result. A lost response can be recovered here before another attempt. No growing list/search endpoint is needed.

Proposed retry semantics: required body UUID key, scoped to business/branch and settlement operation, normalized request includes order ID, expected amounts/currency/scale, fiscal revision, Business display revision and canonical optionalChargeIds. Same key/content replays the original committed result before current-policy recalculation; changed content conflicts. Different keys racing for one order cannot create a second bill/payment: loser gets an already-settled conflict and recovers through readback. Retain successful identity with financial history; no purge/expiry feature in this slice. Failed transactions leave no successful retry record. Current authorization is required even on replay. Exact key shape and safe error mappings are defined in the BP-00 HTTP contracts below.

Read representations deliberately select bill ID, scoped order ID, monetary lines/breakdown, fiscal-policy snapshot, settlement time and cash result. Actor attribution stays stored internally unless an approved consumer needs it. No credentials, customer fields or raw persistence exports. Admission must account for Orders' up-to-1 MiB history plus bill overhead, with the exact envelope bounds and no-truncation rules defined below. No new Orders capture limit is inferred.

Failures distinguish invalid input, not-found within scope, denied access, unresolved fiscal policy, stale assessment, retry-content conflict, already-settled, capacity/overflow and unavailable persistence. All fail without partial settlement. HTTP translation uses shared DTO/envelope/Problem Details/correlation with no-store and safe diagnostics; domain/application remain HTTP-independent. No logs of financial request bodies, customer content or secrets. The exact accepted protocol is defined below; source availability and evidence limits are recorded in the tracker.

## Acceptance criteria

The tracker maps these criteria to focused offline evidence and explicitly unexecuted persistence obligations.

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

No fiscal invoice/receipt or tax compliance claim follows from a bill detail response. No print delivery, cash balancing, collection/completion, stock effects, recovery readiness or complete trading-flow acceptance. Corrections/refunds, pre-settlement order cancellation, fiscal applicability/output and retained-history/access policies are material later scope before affected restaurant operation, not conveniences silently classified P1. Keep Kitchen's [accepted operational deferrals and composed evidence](../../../../kitchen/docs/features/preparation/phase-tracker.md#user-acceptance-and-closeout--2026-10-25) unchanged.

## BP-00 settings and defaults — 2026-10-26

Design defined at the user's request for configurable tax/pricing and restaurant details. Concrete defaults below are recommendations for this development increment, not verified fiscal obligations or approval to operate. No legal-entity module. No implementation or endpoint is activated.

### Billing policy — bounded multiple-rule revision

The owner authorized expanding BP-00 to multiple taxes and service/seating charges, and approved sample values for development. This supersedes the previous singleton tax model. The user accepted this design and authorized isolated BP-01 source/offline delivery; database execution and live activation remain unauthorized. Billing owns one policy per trusted business/current bound branch; no branch override, legal-entity hierarchy or new owner role. Current administrators configure it; staff read it. No Pakistan-specific rate/name is hardcoded.

| Field | Allowed values / meaning | Initial value |
| --- | --- | --- |
| `status` | `unconfigured` or `configured`; configured empty taxes explicitly means administrator selected no taxes, not inferred exemption | `unconfigured`, blocks payable/settlement |
| `currencyCode`, `scale` | Configured policy must explicitly match current Business/captured supported currency/scale; otherwise both null. Prevents fixed charges changing monetary meaning after currency changes | null, null |
| `rounding` | `halfUp` or `halfEven`, exact nonnegative integer rounding; applies to defined stages below | `halfUp`, approved engineering default for this development scope, not fiscal advice |
| `charges` | 0–8 complete ChargeRule objects | `[]`, no assumed service/seating charge |
| `taxes` | 0–8 complete TaxRule objects | `[]`, no assumed government taxes |
| `configurationNote` (write metadata) | Required trimmed 1–500 Unicode code points, no control/surrogate characters on each replacement; internal change rationale, excluded from effective policy/read views | No initial note; never proof of fiscal applicability |

All write fields are explicit, plus expectedRevision. Unconfigured requires null currency/scale and empty rule arrays; returning to it blocks new calculation/settlement but not authorized historical read/replay. Configured requires valid currency/scale, even if both arrays are empty. No silent defaults for new rules: fields below are mandatory. Labels are trimmed plain text 1–80 Unicode code points without control/surrogate characters. Rate strings are canonical decimal 0–100 inclusive with at most four fractional digits, no exponent/sign/leading zeroes/trailing fractional zeroes. This is a technical supported range, not a legal maximum. Fixed minor values use canonical positive strings up to 24 digits.

**ChargeRule**, exactly `{id, enabled, label, application, kind, fixedMinor, ratePercent}`:

- id: client-generated stable UUID, normalized lowercase; enabled: boolean; application: `automatic` or `optional`.
- kind `fixed`: positive fixedMinor, ratePercent null; applied once per order in the policy currency/scale. kind `percentage`: fixedMinor null, positive ratePercent; base is always net merchandise subtotal, after included-tax extraction. No charge-on-charge/tax calculation.
- Each enabled automatic charge applies once; each enabled optional charge applies only when explicitly selected in assessment/settlement. Disabled rules never apply. Labels such as service/seating carry no special algorithm.

**TaxRule**, exactly `{id, enabled, label, ratePercent, priceMode, targets}`:

- id UUID, enabled boolean, label/rate as above (zero rate allowed and retained distinctly from no taxes); priceMode `inclusive` or `exclusive`.
- targets is exactly `{merchandise, chargeIds}`: boolean merchandise, 0–8 distinct normalized UUID charge IDs. At least one target; every reference must identify a charge in the same complete policy, even if disabled. Selecting a charge controls whether it contributes a tax base; referencing it is not an instruction to apply it.
- Inclusive taxes require merchandise=true and chargeIds=[]; they share the same net merchandise base. Exclusive taxes may target merchandise and/or named charges, independently; no tax rule references another tax. Charge prices are net; taxes on them are exclusive only.

Reject duplicate IDs across both arrays, duplicate references, dangling references, invalid null combinations, arbitrary fields/formulas and unsupported bases. Canonical-sort rules and target IDs by lowercase UUID before storing/comparing/output; reorder-only replacements are no-ops. Preserve IDs for the same rule across edits; labels/rates may change with policy revision. Removed IDs are retired and cannot be reintroduced or repurposed; retain identity in owned policy history. All rule inclusion/rate/amount/target changes increment policy revision, including disabled-rule changes. No runtime tax guessing from government/brand/location names.

**Selection:** assessment and settlement both require `optionalChargeIds`, an explicit array of 0–8 unique UUIDs (`[]` means no optional charges). Normalize IDs lowercase, sort lexicographically; reject duplicates, unknown, disabled or automatic-rule IDs, never silently ignore. Only this configured selection is staff-controlled; no caller amount/rate/waiver or per-person/per-seat count. An automatic charge cannot be waived by omitting it. Cashier receives itemized assessment before confirming full payment.

**Boundaries:** merchandise taxes apply uniformly to all captured lines; item categories/exemptions, customer exemptions, tax-on-tax, compound taxes, fixed government levies, tax-inclusive charges, charges based on other charges, per-person/per-seat/time quantities, automatic dine-in classification, discounts, tips and scheduled policies remain outside this increment. A seating-named optional fixed charge is per order, not a delivered seating workflow. Existing Orders remains takeaway. Installations needing excluded tax behavior cannot use this slice for affected sales; no coverage/compliance claim for all Pakistan or global cases.

### Exact calculation rules

Use arbitrary-precision integers; parse each percent into units u, where 1% = 10,000 units, D=1,000,000. Round exact nonnegative quotient/remainder using configured halfUp or halfEven; never use floating point or round per-unit tax before multiplying quantity. Rule UUID ordering is deterministic presentation/tie-break order, not configurable compounding priority.

1. For each captured merchandise line gross-or-net amount M (unit amount × quantity), let U=sum of enabled inclusive merchandise rate units. If U=0, included total T=0 and net N=M. Otherwise T=round(M*U/(D+U)), N=M−T. Allocate T to included rules by taking floor(M*u_i/(D+U)) for each, then distribute the remaining T−sum(floors) one minor unit to largest exact remainders, UUID ascending ties. This is reconciliation of a rounded included total, not independent rounding that could exceed M or rescaling rounded T. Zero-rate rules receive zero. Included tax bases in output are captured M, with priceMode indicating extraction.
2. Each enabled exclusive merchandise tax independently computes round(N*u_i/D) on that line; never taxes gross M when it contains included taxes. Line tax=sum of included and exclusive components; line payable=N+line tax=M+exclusive components. All merchandise taxes are line-rounded; sum their component values afterward.
3. Sum N across lines to net merchandise subtotal B. Each applicable fixed charge C is its fixedMinor; each percentage charge C=round(B*u/D), calculated once per order. Charges never change one another's base; percentage charges may round to zero and remain itemized. No item allocation of order-level charges is claimed.
4. For each applied charge C, every enabled exclusive tax referencing that charge computes round(C*u_i/D), once for that charge. All applicable taxes use the charge's net amount, never another tax/charge. Disabled/unselected targets contribute nothing.
5. Sum breakdowns: merchandiseMinor=sum captured M; merchandiseNetMinor=sum N; chargesMinor=sum C; includedTaxMinor=sum T; addedTaxMinor=sum all exclusive merchandise/charge tax; taxMinor=included+added; netMinor=merchandiseNet+charges; payableMinor=netMinor+taxMinor=merchandiseMinor+chargesMinor+addedTaxMinor. Never add includedTaxMinor twice. Each public/stored monetary field must be within 24 digits; intermediate products may exceed that bound. Reject nonpositive total payable, overflow/currency inconsistency/capacity before writes.

Development examples only, not Pakistan rates or obligations:

| Scenario | Exact expected values (minor units) |
| --- | --- |
| M=100000, exclusive taxes A=10%, B=2%; automatic service=5% net; A targets merchandise+service, B merchandise only | Net merchandise100000; service5000; A=10000+500=10500; B=2000; payable117500 |
| Same scenario, optional seating=2000 selected; A also targets seating | Charges7000; A10700; B2000; payable119700. With [] seating selection, payable117500 |
| M=11200, inclusive A10%+B2%; no charges/exclusive taxes | Included1200 allocated A1000/B200; net10000; payable11200 |
| M=2, inclusive A100%+B100%, halfUp | Included total1; exact fractions each2/3; floors0/0, remaining1 goes to smaller UUID; net1; payable2, never two independently rounded tax units |
| M=5, exclusive A10%, halfUp versus halfEven | Tax1 versus0; two identical lines produce total2 versus0, not whole-order rounding |
| Configured with empty taxes/charges versus unconfigured | Configured payable=M, explicit no taxes/charges; unconfigured has no payable |

These are specified expectations only; no calculations/tests have executed in this planning task. Actual rates, scope/bases, inclusive meaning, rounding/allocation and receipt obligations need confirmation before restaurant operation.

### Existing restaurant settings and fixed boundaries

Reuse Business-owned `business.name` and `branch.name` (required trimmed 1–120 code points), optional `branch.address` (1–500), validated currency and timezone. No default restaurant identity, address, registration number or new duplicate `restaurantName` setting. Existing values are the source; missing optional address stays absent. Billing snapshots those display details at settlement through a supported Business interface in the same authorized transaction. Business owns provisioning/context and isolated BP-01 display source. Use the narrow Business-owned administrator update for these existing name/address fields, using expected revision, trusted scope, CSRF and retained actor/time; staff read only. Names have no defaults beyond provisioned values; optional address can be explicitly cleared. Display revision starts at 0 for provisioned values, increases on actual changes and stays unchanged for an identical current-revision replacement. Optional address uses null to clear, with absence in stored/read display projection. Concurrent/stale changes conflict. Currency/timezone are read-only in this increment. Billing consumes a supported transactional display projection and never edits foreign tables. This is a BP-01 source addition; live activation remains excluded.

Cash-only/full-positive-payment, exact-received semantics, no correction/refund operations and no physical/fiscal receipt output remain workflow boundaries, not pretend configurable switches. No payment-method list containing unsupported integrations. No configurable financial-history deletion, retry safety, authorization bypass or rounding precision. Later methods/categories can extend explicit contracts when their workflows are justified.

### Change control and history

Server owns `revision` (initial effective configuration revision 0 for unconfigured state), trusted business ID, verified actor ID and UTC change time; clients cannot supply those as configuration values. Every accepted replacement requires `expectedRevision`; stale writes conflict with no change. An identical normalized replacement of effective values at the current revision is a no-op, even if the submitted note differs; no revision/audit event is added for note-only changes. Actual changes increment revision once and retain old/new policy plus actor/time/note. No-op requests using an old revision still conflict. Writes use current administrator/session/grant/CSRF authorization in the existing transaction; staff cannot edit policy.

Changes take effect immediately for subsequent assessments/settlements, including previously captured but unpaid orders. An assessment is nonbinding: settlement requires its policy revision, Business display revision and expected totals, and conflicts after a policy change. Completed bills retain the exact policy revision/full rule definitions, canonical optional-charge selection, Business display revision/snapshot and complete monetary/component breakdown; replays return the original result even if settings later change. Retain configuration history with financial records; no deletion/retention control in BP-01. Updating settings is not permission for operational use: fiscal applicability, receipts/corrections and release gates still apply.

### Configuration acceptance

| ID | Required future observation |
| --- | --- |
| BP-A08 | Initial unconfigured policy blocks payable/settlement; configured/no-tax/zero-rate and full multiple-rule combinations validate; malformed/unknown/unsupported values fail atomically; an enabled zero-rate rule remains distinguishable from empty taxes |
| BP-A09 | Staff edits to billing and Business display settings denied; current administrator change records server actor/time and one revision; concurrent/stale writes conflict; old bills and authorized successful replays keep original policy/display details |
| BP-A10 | Approved independent examples cover inclusive/exclusive, both rounding ties, multiple quantities/lines, total reconciliation and overflow; absent settings never become zero tax; unsupported item-category/compound workflows are outside availability |

The following accepted contracts define transport/representation/capacity. Current focused offline evidence and unexecuted persistence obligations are recorded in the phase tracker.

## BP-00 HTTP contracts — 2026-10-26

Contract status: **BP-00 accepted; BP-01 isolated source implemented, awaiting user review**. Executable input structure: [Billing DTOs](../../../http/billing-input.dto.ts), [Business display DTO](../../../../business/http/display-input.dto.ts). Explicit results: [Billing domain contracts](../../../domain/billing.ts), [Business DisplayView](../../../../business/application/display-settings.ts). The prose below owns intended semantics and limits. Common rules apply to every listed operation, followed by operation-specific differences.

### Routes and admission

| Method / path | Owner / policy | Request | Success data / status |
| --- | --- | --- | --- |
| GET `/api/v1/billing/policy` | Billing / staff | No body contract | PolicyView / 200, including virtual initial unconfigured revision 0; GET never inserts defaults |
| PUT `/api/v1/billing/policy` | Billing / administrator | PolicyReplacement | Current PolicyView / 200, including supported no-op |
| POST `/api/v1/billing/assessments` | Billing / staff | `{orderId, optionalChargeIds}` | AssessmentView / 200; no assessment ID, Location, persisted draft, bill/payment or retry record |
| POST `/api/v1/billing/bills` | Billing / staff | SettlementRequest | BillView / 201 on creation and exact replay; Location `/api/v1/billing/orders/<orderId>/bill` |
| GET `/api/v1/billing/orders/:orderId/bill` | Billing / staff | UUID orderId path | Original BillView / 200; no bill gives BILL_NOT_FOUND, including captured/unsettled, absent or foreign orders |
| GET `/api/v1/business/display-settings` | Business / staff | No body contract | DisplayView / 200, scoped to the current bound business/branch |
| PUT `/api/v1/business/display-settings` | Business / administrator | DisplayReplacement | Current DisplayView / 200, including supported no-op |

Staff policy includes current administrators under the accepted Access behavior; no new cashier/owner role. Trusted installation and current grants/session/account checks use the existing Access boundary. All POST/PUT require its approved origin and CSRF proof; GETs preserve current HTTPS/authority/origin/session checks without a new CSRF requirement. All routes reject every query key, including duplicate/unexpected scalar values. No lists, filters, cursors or pagination. GET has no request-body contract; do not add a generic body detector as incidental work.

Assessment is deliberately POST: `runAuthorized` requires CSRF and touches session activity even when its callback only reads. The callback creates no Billing/Orders/Business records; the existing Access session touch is technical activity, not a sale. A GET assessment would require a new Authentication read-transaction contract; that extension is excluded. Repeating assessment is safe but can produce changed values after configuration changes. In its one authorized transaction, assessment checks scoped existing settlement first (ORDER_ALREADY_SETTLED), then scoped Orders projection (ORDER_NOT_FOUND), source/currency consistency, configured policy, valid optional-charge selection, positive exact multiple-rule calculation and both capacity admissions. It reads policy and Business display in that transaction and returns their coherent revisions; it writes no successful retry identity.

### Common input, output and limits

- JSON POST/PUT require `application/json`, UTF-8 with optional charset. Existing global request body limit is 16,384 bytes; do not raise it. Unsupported media 415, malformed JSON 400 and oversized body 413 follow adapter/shared-boundary limits below. No strict Accept negotiation is added; ordinary JSON and Problem Details follow existing behavior.
- Bind concrete runtime body/path DTO classes through DtoValidationPipe; EmptyQueryDto on every route. Reject implicit scalar conversion, unknown fields, extra nested fields, duplicate scalar query parameters, array/object substitutions and omitted/null required values. Duplicate JSON property detection is not guaranteed by the existing parsed-body pipe; no custom parser is added. Keep application/domain normalization/invariants for non-HTTP callers. IDs accept the existing case-insensitive hexadecimal `8-4-4-4-12` UUID shape and normalize lowercase; no new version/variant constraint is imposed.
- Money is a canonical unsigned base-10 integer string: `0` or a nonzero leading digit followed by at most 23 digits. No sign, leading zeroes, decimal point, exponent or numeric JSON value. Expected payable must be positive. Currency is a three-letter uppercase string matching captured and bound configured currency; scale is a JSON integer 0–4 matching captured supported precision. No admin-selected precision or floating point conversion.
- Revisions are JSON integers 0–2,147,483,647. Any actual edit at maximum revision fails REVISION_CAPACITY before writes; an identical current-revision replacement remains a no-op. Initial Billing revision 0 is virtual until a first actual change; Business display revision 0 covers the provisioned bound tuple. Do not lazily write on GET.
- Every ordinary success is `{data: <defined view>, meta: {requestId}}`, `application/json`, server X-Request-Id matching meta, Cache-Control no-store. IDs are opaque lowercase UUIDs; instants are UTC ISO 8601 with millisecond precision. Optional absence is documented per field below; no other fields are exposed. Replay returns original data with the current request's requestId.
- AssessmentView and BillView each have a **2,097,152-byte** UTF-8 serialized success-envelope cap; PolicyView/DisplayView each have a **16,384-byte** envelope cap. Errors use the existing shared safe bounded details, never whole source records. Technical caps are not configurable restaurant policy.
- Before returning assessment, admit both its serialized view and its prospective final BillView. Before committing settlement, admit the exact final view including UUID bill ID, 24-character timestamp, singular payment and 36-character requestId reservation. Never truncate, silently lower Orders limits or claim all accepted Orders necessarily fit. A response-capacity failure commits no bill/payment/retry; accepted historical read/replay must remain within the same versioned representation bound. No postcommit representation growth is introduced by this contract.

### Exact write shapes

**PolicyReplacement** has exactly `{expectedRevision, status, currencyCode, scale, rounding, charges, taxes, configurationNote}`. Complete nested rule schemas and initial defaults are defined above. Every field is required; only documented nulls accepted. Normalize UUIDs/text and canonical-sort rule/reference arrays. Percentage syntax must already be canonical. Validate references/combinations, retired-ID reuse and current bound currency before an actual change. The note is write-only audit metadata; compare effective values, not note text. PUT replaces the entire policy, not PATCH.

Before accepting a policy change, admit its 16,384-byte response envelope and a future complete replacement body including expectedRevision's maximum width and a reserved 500-code-point/four-byte-per-code-point note. Reject POLICY_CAPACITY atomically if it cannot fit the existing request cap; no uneditable configuration, silent truncation or larger global body limit.

**DisplayReplacement** has exactly `{expectedRevision, businessName, branchName, branchAddress}`. Names are required trimmed 1–120 Unicode code points without control/surrogate characters; branchAddress is required as either null (clear) or trimmed 1–500 code points under the same text rule. Reuse Business validation. No currency/timezone/IDs/actor/profile extension fields. One revision identifies the complete bound `(business.name, branch.name, branch.address)` tuple; any actual change increments it once. HTTP address is always string or null; internal Business projection may omit absent address. Initial display revision/history storage is a new Business prerequisite, not an existing field. Actual changes retain old/new tuple and verified actor/time in Business-owned history; no history-list API.

**SettlementRequest** has exactly these required fields:

| Field | Definition |
| --- | --- |
| `orderId` | UUID of a captured order in trusted current branch |
| `optionalChargeIds` | Required 0–8 distinct configured enabled optional charge IDs; structural normalization before replay, policy validation only after replay/revision gates |
| `retryKey` | UUID generated once per logical settlement; normalize lowercase; required body key only, no Idempotency-Key header contract |
| `expectedCurrencyCode` | Captured uppercase currency code from assessment |
| `expectedScale` | Captured numeric scale from assessment |
| `expectedPayableMinor` | Positive canonical minor string, at most 24 digits |
| `expectedPolicyRevision` | PolicyView revision from assessment |
| `expectedDisplayRevision` | DisplayView revision from assessment |

No method, tendered/change amount, tax totals, state, business/branch/actor, collection flag or print proof. Selecting this cash-only operation means operator assertion of full exact cash receipt. Do not infer physical receipt of money from success. No payment-processor call or external I/O.

### Exact public views

**PolicyView**: exactly `{revision, status, currencyCode, scale, rounding, charges, taxes}` with complete canonical rule arrays as defined above. Initial view is revision0, unconfigured, null currency/scale, halfUp and two empty arrays. Configured empty taxes is deliberate no-tax selection; an enabled zero-rate rule remains identifiable. No audit note/actor/time, fiscal-approval flag or production sample defaults.

**DisplayView**: exactly `{revision, businessName, branchName, branchAddress, currencyCode, timezone}`. Address is string or null; currency/timezone are current Business-validated read-only values. Bill-time display includes these values at settlement, not a live join.

**BillingLine**: exactly `{position, quantity, sellingUnit, unitMerchandiseMinor, merchandiseMinor, netMinor, taxes, taxMinor, payableMinor}`. Taxes is an array of 0–8 TaxComponent objects defined below; zero-rate applicable enabled rules remain visible. Position is stable zero-based captured line index (0–499); quantity is the captured integer 1–1,000. Monetary fields use common minor-string syntax; unitMerchandiseMinor includes captured options/extras already priced by Menu—never add them twice. `sellingUnit` is an explicit captured allowlist:

- `{offeringId, name, components, addOns, choices}`; no live Menu data or source policy/request/customer/instructions.
- Each component is `{itemId, itemName, variantId, variantName, quantity}`; component quantity is per selling unit, not multiplied again into line money. This preserves captured size/variant distinctions.
- Each add-on is `{id, name}`; each choice is `{groupId, optionId, name}`. Retain source order/duplicates where meaningful. Source names/array bounds are those accepted in Orders' stored Menu resolution; do not reinterpret or allow client-supplied composition. The aggregate 2 MiB cap also applies. Nested source surcharges/selection request are not exposed; captured unit/line amounts are authoritative.

**TaxComponent**: exactly `{ruleId, baseMinor, amountMinor}`; ruleId references the snapshotted billingPolicy tax rule, which supplies label, rate and priceMode. For included merchandise tax, baseMinor is captured M used in extraction; for exclusive merchandise it is N; for a charge it is C. One component per enabled applicable tax, even when amount is zero. Arrays are UUID sorted. No implied independent rounding of included components; use the allocation rule above.

**ChargeLine**: exactly `{ruleId, baseMinor, netMinor, taxes, taxMinor, payableMinor}`. Rule references the snapshotted policy label/kind/value; baseMinor is B for percentage and null for fixed. Taxes has 0–8 TaxComponents; netMinor is C; payableMinor=C+taxMinor. Applied charges are UUID sorted, 0–8 entries; unselected/disabled charges do not appear, and zero-rounded applicable percentage charges do appear.

**TaxSummary**: exactly `{ruleId, merchandiseBaseMinor, chargeBaseMinor, merchandiseTaxMinor, chargeTaxMinor, amountMinor}` per enabled tax with at least one applied target; amounts sum matching line/charge components, not a recalculation on grand totals. Bases sum matching component bases (including gross M for included extraction), each charge counted once per tax. An enabled tax only referencing unselected/disabled charges has no components/summary; its definition still exists in the policy snapshot. UUID sorted, 0–8 summaries. No mixing amounts with different currency/scale.

**AssessmentView**: exactly `{orderId, capturedAt, fulfillment, currencyCode, scale, businessDisplay, billingPolicy, optionalChargeIds, lines, charges, taxSummary, merchandiseMinor, merchandiseNetMinor, chargesMinor, includedTaxMinor, addedTaxMinor, netMinor, taxMinor, payableMinor}`. Fulfillment takeaway; businessDisplay is DisplayView; billingPolicy is PolicyView. Lines retain captured order, 1–500 entries; charges/summary use the finite definitions above. Selected optional IDs are sorted, even where their charge rounds to zero. Totals use the reconciliation equations above. No bill ID/payment/settledAt/status/expiry token. Already-settled assessment returns ORDER_ALREADY_SETTLED and recovers via saved-bill GET, never a new payable.

**BillView**: exactly AssessmentView's fields frozen at settlement, plus `{id, settledAt, payment}`. Payment is exactly `{method: "cash", amountMinor}`, where amountMinor equals bill payable and is positive. Bill ID identifies the one settlement aggregate; no independent payment ID/state/timestamp is justified for its singular atomic payment. Settlement time/actor belong to that whole event; verified actor remains internal. No paid/printed/fiscalized/collected flags, receipt number, raw retry key/request, configuration note, staff profile, customer contact/instructions or ownership/persistence rows.

### Financial and persistence invariants

The multiple-rule calculation/rounding/allocation rules above are canonical. Validate source amountKind=merchandise, captured/takeaway state, supported currency/scale, positive bounded quantities, unit × quantity = line amount and sum of line amounts = captured total. Corrupt/inconsistent source fails closed as internal error, not client validation or a guessed payable. Every line/charge/bill obeys net + tax = payable; bill also obeys merchandise + charges + added tax = payable. No current Menu lookup or double-addition of captured option surcharges.

New assessment/settlement requires all three monetary identities to match: captured Orders currency/scale, current Business configured currency/scale, and configured Billing policy currency/scale (before applying any fixed charge); old read/replay uses saved currency without re-resolving current policy/Menu/Business. No import of Menu's internal precision table or foreign persistence. Orders' billing projection validates captured supported monetary identity behind Orders public.ts, returns a narrow typed result and never reprices; Business supplies current supported context/display behind its public interface. These operations and matching Nest provider exports are source prerequisites. Preparation projection remains unchanged.

Billing owns one immutable settlement aggregate containing bill, singular payment, normalized successful request and internal verified actor/time. Atomic unique identities are `(businessId, branchId, orderId)` and `(businessId, branchId, retryKey)`. No successful key or partial aggregate survives rollback. Separate payment tables/general ledger/outbox are not required for this cash-only outcome. Source migrations may add integrity constraints but are not executed by planning/source permission.

In one `runAuthorized` staff transaction, after structural normalization:

1. Find successful retry under trusted business/branch/key. Same normalized request returns original saved BillView without current order/config/amount recalculation, including when policy is now unconfigured. Different normalized request returns SETTLEMENT_RETRY_CONFLICT without disclosing original order/result. Normalize UUID casing; compare all eight request fields, including both revisions and canonical optionalChargeIds. Request key maps to its retained outcome; no failure outcome is retained.
2. With no successful key, find settled bill under trusted order identity. If found, return ORDER_ALREADY_SETTLED regardless of current policy. Do not attach a second successful key or cash payment; read via canonical known-order route.
3. Read the Orders financial projection, current Billing policy and Business display through the same opaque transaction. Missing/foreign order is ORDER_NOT_FOUND. Validate source and currency compatibility; require configured policy (BILLING_POLICY_UNCONFIGURED takes precedence over stale revisions if policy was reset). Compare both revisions before current optional-charge validation, recalculation or expected currency/scale/payable comparison. Validate selectors only against that winning configured policy; replay never consults current rules. Any changed expectation is STALE_ASSESSMENT; no partial bill/retry. Policy/display changes after assessment require refresh even when payable happens to match.
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
| `BILL_CAPACITY`; `POLICY_CAPACITY`; `BILL_AMOUNT_OVERFLOW`; `UNSUPPORTED_BILL_CURRENCY`; `UNSUPPORTED_ZERO_PAYABLE` | 409 | No details; no bill/payment/key committed, requires supported scope/request |
| `REVISION_CAPACITY` | 409 | No details; no increment/wrap; requires separately scoped migration, not reset |
| Known owned persistence unavailable `BILLING_UNAVAILABLE`; `DISPLAY_SETTINGS_UNAVAILABLE` | 503 | No fabricated Retry-After; reconcile uncertain settlement by GET/original key |
| Current Access policy failures | Existing 400/401/403/404/409/429/503 as mapped by shared Access policy | Preserve existing challenge/throttling/Retry-After behavior; no separate Billing authorization formatter |
| Unexpected/corrupt source/commit failure not classified as known unavailable | 500 `INTERNAL_ERROR` | Shared safe correlation, no raw diagnostics; uncertain outcome recovered as above |

No intentional success on unsupported refund/edit/delete/print requests. Unmatched routes/methods and adapter parsing/media/size failures can precede method opt-in; preserve the existing documented legacy fallback rather than promise every such failure is Problem Details. Do not add 405/Allow negotiation or migrate old routes as incidental work.

### Wiring, compatibility and design evidence

Source inspected: [bootstrap](../../../../../main.ts) already calls createHttpAdapter with the 16,384-byte request cap and completion reporting; [AccessHttpModule](../../../../authentication/http/access-http.module.ts) registers HttpContractGuard before AccessBoundaryGuard, one response interceptor and shared Access fallback. [Kitchen controller](../../../../kitchen/http/kitchen.controller.ts) and [semantic filter](../../../../kitchen/http/kitchen-exception.filter.ts) demonstrate applicable composition. [runAuthorized](../../../../authentication/application/access.service.ts) checks CSRF/touches session; [BusinessService](../../../../business/infrastructure/business.service.ts) has context/bootstrap but no display revision/edit; Orders currently exports preparation only.

At authorized source entry, mark these seven new JSON methods with HttpContract, bind runtime DTOs, compose module semantic filters through existing HttpContractFilter/errorPolicy, and preserve global registration. Billing imports supported Orders/Business/Authentication public providers; Business must not import Billing. No second adapter/guard/interceptor/error framework, automatic response sanitizer or legacy Orders/Kitchen migration. Explicit output allowlists and precommit capacity checks are module responsibilities. Logs use existing request ID/route-template/status metadata, never financial bodies/raw URLs/query values/notes/customer content. No external telemetry or new log retention policy.

Design review covers the REST checklist's input/response selection, status/envelope/headers, trusted scope, revision/retry concurrency, failure recovery and compatibility. Collection/pagination is not applicable; no collection endpoint exists. These are new contracts with no current Billing consumers; accepted Orders/Kitchen contracts/evidence remain unchanged. This paragraph records BP-00 design evidence only; current BP-01 executed offline checks and unexecuted persistence obligations are recorded in the phase tracker. Design completeness is not runtime, fiscal applicability, receipt output, user acceptance or restaurant-readiness evidence.

### Additional contract acceptance

| ID | Required future evidence / exit |
| --- | --- |
| BP-A11 | Seven concrete DTO/shared HTTP routes obey method/media/query/body/path validation, exact success views, nulls, Location/replay status, safe Problem Details and adapter fallback limits; no foreign/customer/audit leakage |
| BP-A12 | Both policy/display edits race with settlement: one coherent serial revision wins or stale assessment rejects; note-only no-op, stale same-content update and maximum revision behavior are explicit |
| BP-A13 | Replay after unconfiguration/display/currency changes returns original data under current authorization; revoked session fails; changed revision with same amount conflicts on key; settled assessment never reprices |
| BP-A14 | Line quantity/composition distinctions, line-round-then-sum ties, source corruption, zero payable, overflow and both 2 MiB admission boundaries produce the defined result with no partial financial records; real uniqueness/rollback/fresh-process evidence remains BP-02 |

BP-A01–14 plus the extension below define the accepted source scope; they do not reopen upstream tests. Sample development values and bounded BP-01 source delivery are explicitly approved. Actual fiscal applicability/rates and restaurant use remain unapproved. Offline samples never become installed policy defaults.

### Multiple-rule acceptance extension

| ID | Required future evidence |
| --- | --- |
| BP-A15 | Two simultaneous merchandise taxes, tax on selected service/seating charges and explicit untaxed charges follow their exact target sets; no tax-on-tax, charge compounding, duplicate application or hidden zero-tax fallback |
| BP-A16 | Fixed/percentage, automatic/optional charges; [] versus selection; unknown/disabled/automatic/duplicate IDs reject; required selection is persisted and participates in normalized retry identity; removed charges still replay original result |
| BP-A17 | Multiple included taxes reconcile by exact remainder allocation, stable UUID ties, zero rate and tiny amounts; mixed included/exclusive taxation uses net merchandise, never implicitly taxes tax; both rounding modes and multi-line totals reconcile |
| BP-A18 | Full nested rule DTO/reference/currency validation; reorder-only no-op; rule disable/remove/edit races trigger revision conflicts; retired IDs cannot be reused; maximum 8+8 rules and 2 MiB component-expanded response/request round-trip caps fail atomically without partial policy/settlement |

BP-A01–18 define the accepted source scope and persistence evidence limits. No added HTTP methods, Menu/Orders tax-category changes, Kitchen lifecycle work or expanded payment methods are implied. Historical single-rate definitions remain in Git at 5b0f57e, superseded here rather than left as competing active contracts.
