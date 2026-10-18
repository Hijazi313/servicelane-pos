# Minimal catalogue — Specification

Owner: [Menu](../../README.md). Decisions: [MN-D01–06](decisions.md). Status, authorization and evidence: [phase tracker](phase-tracker.md).

## Outcome and scope

MN-01 delivers protected catalogue maintenance and non-persisting selection/pricing APIs for the current branch. The user requires selectable sizes, add-ons and configurable combos. [MN-00](../../../../authentication/docs/features/access/spec.md#mn-00--transactional-module-authorization) is the preceding Authentication integration phase; MN-01 writable API delivery depends on its acceptance. This is backend development, not a complete restaurant POS.

All requirements below are **phase P0** for this outcome. No browser UI or generic settings engine is implied.

| ID | Requirement | Why necessary / simplest boundary |
| --- | --- | --- |
| MN-R01 | Maintain named ordinary/sized items with prices and active state | Provides saleable definitions; one absolute price per variant avoids size-delta rules |
| MN-R02 | Optional item-local extras, with allowed options, surcharges and configurable maximum distinct selections | Required add-on workflow; minimum is zero, each option selected once |
| MN-R03 | Combos with a base price, fixed components and/or configurable min/max choice groups | Supports fixed meals and customer choices as data; no nested combos or conditional engine |
| MN-R04 | Validate one selling-unit selection and return current exact price/composition | Prevents invalid combinations; no basket, stored quote or order |
| MN-R05 | Administrator maintenance; administrator/staff active catalogue read and resolution within their business/branch scope | Reuses existing RBAC plus scope checks through MN-00; no implicit Menu rights |
| MN-R06 | Atomic writes, per-offering stale-edit checks and coherent resolution | Prevents partial definitions, lost edits and mixed-state prices without unrelated-edit conflicts |

## Catalogue rules

- Catalogue configuration is business-owned Menu data used by the installed branch. Names, sizes, choices, prices and selection limits are configured per offering; there is no global combo-mode switch. Branch overrides are deferred.
- An ordinary item has one default variant. A sized item requires an explicit variant choice; never select the first size silently. Optional extras apply equally across an item's variants and contribute their surcharges.
- A combo references ordinary-item variants with positive integer component quantities. Choice groups specify allowed variants, nonnegative surcharges and minimum/maximum distinct options. A fixed combo needs no choice input. Combo base price replaces standalone component prices; selected choice surcharges are added. No inherited component extras or combo-local extras.
- Group limits must satisfy `0 <= minimum <= maximum <= option count`; options cannot repeat. Required groups must be satisfiable when saved. Every reference must belong to the current business and intended parent. Reject foreign/unconfigured choices, duplicates and unknown fields, including supplied prices or component quantities in selection requests.
- Inactive fixed components make a combo unavailable. Inactive alternatives cannot be selected; other alternatives remain valid while every group's minimum is achievable. Never substitute silently. Deactivation does not rewrite dependent combo definitions.
- Money uses the configured currency, exact minor-unit arithmetic and decimal-string transport. Reject negative amounts and excess fractional precision; zero is permitted. [MN-D05](decisions.md#mn-d05--money-and-input-defaults) defines precision and naming defaults. Definition and selection payloads have explicit finite technical bounds.
- Stable IDs establish identity. Offering names may duplicate; size labels within an item and option labels within a group must be distinguishable after trimming/case normalization. Names are nonblank and bounded.

## Writes and reads

Each offering has its own revision. Edit/deactivation checks that offering's expected revision; modifying a dependency does not increment dependent combo revisions. No destructive deletion or variant reparenting in this phase.

All definition writes run through MN-00's authorized transaction, holding the existing installation-local access lock. After acquiring it, check the target revision, re-read dependencies and save atomically. No other Menu writer may bypass this protocol. If deactivation commits first, a combo save requiring that inactive component fails; if the save commits first, later deactivation makes it unavailable. Foreign keys protect reference existence/ownership, not active status. Unrelated edits serialize briefly but both succeed; no global revision or dependency-revision graph.

Resolution reads the necessary Menu state in one database statement, giving one coherent snapshot without a new global lock. If implementation requires multiple statements, settle and verify a snapshot transaction contract before proceeding. A preview may become stale immediately after it returns. Orders must later revalidate and preserve sale-time names, prices, choices, composition and tax details; preview does not guarantee a future sale price.

## Intended API boundary

Source routes use `/api/v1/menu`; [controller](../../../http/menu.controller.ts) and [strict definition/selection validation](../../../domain/catalogue.ts) own executable payload semantics. Runtime/database acceptance remains in the tracker. Menu owns its data and exposes supported operations, never tables, to later consumers.

- Administrator: create/read/edit/deactivate complete item or combo definitions, including local groups; responses include offering revision. No separate size/option micro-CRUD API.
- Administrator/staff: read active offerings/choices and POST one selection for resolution. Input identifies offering, size and selected option IDs; output includes configured currency, exact breakdown, resolved components and offering revision. Revision is an edit token, not a dependency freshness guarantee. Only administrators may inspect inactive definitions.
- Reuse MN-00 access/CSRF and existing origin/error/no-store policies. Authentication failure: 401; permission/CSRF denial: 403; malformed or invalid selection: 400; unknown/foreign resource: 404; stale edit or unavailable selection: 409; context/storage failure: sanitized 503. Resolution POST requires session CSRF proof.

## Illustrations — not confirmed business rules

Synthetic PKR examples only; no restaurant menu, prices or seeds are inferred.

| Definition | Selection and outcome |
| --- | --- |
| Fries: Regular 180, Large 260; optional cheese +70, at most one extra | Large + cheese = 330; missing size or repeated cheese rejects |
| Meal base 650: fixed burger + Regular fries; drink group min/max 1/1, cola +0 or lemonade +30 | Cola meal = 650; lemonade meal = 680; missing/two drinks reject. Configuring fixed cola instead produces a fixed meal. Other configured min/max values remain supported. |

## Acceptance steps

Each row is independently reportable. Rule/boundary checks use existing focused tooling; persistence, restart and concurrency observations require one separately authorized disposable target. Required evidence remains pending in the tracker.

| ID | Requirement | Observable pass condition |
| --- | --- | --- |
| MN-AC01a | R01 | Administrator creates/reads ordinary and sized definitions with stable IDs |
| MN-AC01b | R01 | Saved definitions persist across API restart |
| MN-AC01c | R01, R03 | Invalid amounts, names, limits, quantities, nested combos or foreign references reject without saving |
| MN-AC01d | R01 | Editing/deactivation preserves stable identities and returns the updated offering revision |
| MN-AC02a | R02, R04 | Size plus zero/allowed optional extras yields the exact expected amount, including a supported non-two-decimal currency case |
| MN-AC02b | R02, R04 | Missing size, duplicate/excess/foreign/inactive extras and spoofed prices reject |
| MN-AC03a | R03, R04 | Fixed composition resolves at its base price, independently of standalone component price changes |
| MN-AC03b | R03, R04 | Choice groups enforce configured min/max and compute exact surcharges; check both 1/1 and 2/2 configurations, rejecting missing/excess/duplicate/unconfigured choices |
| MN-AC03c | R03 | Saved group/option/surcharge changes affect later resolution without code changes |
| MN-AC03d | R03, R06 | Inactive alternatives are excluded; an inactive fixed component or unsatisfiable required group makes the combo unavailable |
| MN-AC04a | R05 | Menu routes enforce administrator writes, staff read/resolve and administrator-only inactive inspection |
| MN-AC04b | R05 | Menu routes deny missing/expired/revoked/disabled/forced-change authority, removed grants, foreign IDs and bad CSRF/origin without a write; missing binding fails closed |
| MN-AC05a | R06 | Two edits at the same offering revision yield one success and one conflict |
| MN-AC05b | R06 | Edits to unrelated offerings both commit without false conflicts |
| MN-AC05c | R03, R06 | Controlled combo-save/deactivation interleavings follow the two orderings specified above |
| MN-AC05d | R04, R06 | Concurrent definition edits cannot produce a resolution mixing old base price with new surcharges |
| MN-AC05e | R06 | Injected write failure leaves definition and revision unchanged |
| MN-AC06 | R01–R06 | User reviews actual focused evidence and explicitly accepts the development increment |

## Exclusions

P1 for this increment: combo-local extras, required standalone extras, repeated extras, size-specific extras, nested/conditional combos, reusable modifier libraries, categories/images/search UI, scheduling/imports/publication history and branch overrides. None is needed for the bounded illustrated workflows; revisit only with concrete requirements.

Orders, fiscal treatment, payments, inventory, kitchen/printing, client UI and installation/recovery verification remain later-module or release obligations, not optional product P1. [Cross-cutting rules](../../../../../../../../docs/modules/README.md#cross-cutting-operational-requirements) apply at integration. Existing BA deferred checks remain unchanged.

## Source contracts — MN-01

All prices/surcharges are decimal strings; all active/sized flags and definition arrays are explicit. Root offering IDs, revision, currencyCode and scale are response metadata, not writable definition fields. Existing nested IDs must be retained; omit ID only for a new nested entity. Variants cannot be removed or reparented. Optional groups/options may be removed by replacing the definition; stale selection IDs then reject.

| Method/path (relative to `/api/v1/menu`) | Input / output | Policy |
| --- | --- | --- |
| GET `/offerings`, `/offerings/:id` | Active saleable definitions and selectable choices only | Staff/administrator; session, no CSRF token needed for GET |
| GET `/definitions`, `/definitions/:id` | Complete administrator definitions, including inactive records/dependencies | Administrator |
| POST `/offerings` | `{definition}` → definition with generated IDs and revision 1; 201 | Administrator + session CSRF |
| PUT `/offerings/:id` | `{expectedRevision, definition}` → updated complete definition; 200 | Administrator + session CSRF |
| POST `/offerings/:id/deactivate` | `{expectedRevision}` → inactive definition and next revision; 200 | Administrator + session CSRF |
| POST `/resolve` | `{offeringId, variantId?, addOnIds?, choices?: [{groupId, optionIds}]}` → IDs/names/components, selected extras/choices, currency/scale, basePrice/surcharge/total and offering revision; 200 | Staff/administrator + session CSRF |

An item definition is `{kind: "item", name, active, sized, variants: [{id?, name, price, active}], addOnGroups: [{id?, name, maximum, options: [{id?, name, surcharge, active}]}]}`. A combo definition is `{kind: "combo", name, active, basePrice, components: [{variantId, quantity}], choiceGroups: [{id?, name, minimum, maximum, options: [{id?, name, variantId, quantity, surcharge, active}]}]}`. No combo extras or required standalone extras. Reject mixed-kind fields, client prices/quantities in selections, repeated IDs and empty combos without a fixed component or positive required group.

Technical bounds: 500 offerings per business; 32 variants/item; 8 groups/offering; 32 options/group; positive component quantities up to 1000; labels 1–120 Unicode code points; nonnegative prices up to nine integer digits with registry-defined fractional precision (0–4); edit revisions up to 2147483646. The existing 16 KiB request-body limit still applies. These are documented implementation limits, not restaurant rules.

Persistence uses three Menu-owned tables: definition aggregates with stored currency/scale/revision, an item-variant identity index, and ownership-constrained combo reference edges. The schema entry point re-exports them for offline migration generation only. Migration `0003_menu_catalogue.sql` is source-delivered and applied on the authorized disposable acceptance target; the tracker owns execution evidence and pending user acceptance. No Business/Auth persistence imports or direct writes occur. GETs resolve trusted context using existing AccessService; mutation/resolution callbacks reuse `runAuthorized`. No public cross-module selection service is promised yet; Orders integration will agree its consuming contract separately.
