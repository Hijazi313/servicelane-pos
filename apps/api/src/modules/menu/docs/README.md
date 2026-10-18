# Menu

[Delivery tracker](features/catalogue/phase-tracker.md) owns status, authorization and evidence. Owner: primary agent.

## Outcome and boundaries

Maintain business-owned items, sizes, optional extras and fixed/selectable combos for the installation's authorized branch. Configuration is Menu data exposed through protected APIs; no settings screen or generic settings engine. Menu owns definitions and catalogue pricing. Orders owns sale snapshots; Inventory owns stock; Billing owns tax and payment totals. Cross-module reuse uses supported interfaces.

## Public capabilities

Source capabilities have focused offline and bounded PostgreSQL evidence; migration 0003 is applied on the authorized disposable test target. See the tracker for passing cleanup, remaining evidence limits and pending user acceptance.

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Catalogue maintenance | [MenuController](../http/menu.controller.ts) (`POST/PUT /api/v1/menu/offerings`, deactivate) | Maintain item/size/extra/combo definitions | Administrator + MN-00 session/CSRF; business scoped, per-offering revision; complete definition writes; prospective compact edit envelope must fit 16 KiB after generated IDs/money; schema verified on disposable test target only |
| Active catalogue read | [MenuController](../http/menu.controller.ts) (`GET /offerings`) | List saleable offerings and choices | Authorized current-branch staff/admin; inactive variants/options filtered; one business snapshot |
| Definition inspection | [MenuController](../http/menu.controller.ts) (`GET /definitions`) | Inspect inactive definitions for maintenance | Administrator only |
| Selection pricing | [MenuController](../http/menu.controller.ts) (`POST /resolve`) | Validate selections and calculate exact configured-currency price/composition | Session/CSRF; nonbinding preview, no order or stock writes; no supported cross-module service contract until Orders discovery |

## Scope and sequence

[Catalogue specification](features/catalogue/spec.md) owns P0 behavior and acceptance; [decisions](features/catalogue/decisions.md) owns approved choices and their rationale.

| Phase | Outcome | Dependency / exit |
| --- | --- | --- |
| MN-00 (accepted) | Existing Authentication authorization reused for transactional module writes | [Authentication contract/acceptance](../../authentication/docs/features/access/spec.md#mn-00--transactional-module-authorization); accepted before MN-01 writes |
| MN-01 (evidence delivered; unaccepted) | Protected catalogue maintenance/read and current selection/pricing APIs | Accepted MN-00, separate source authorization and MN-AC01–06 evidence |
| Later Orders integration | Consume selections and preserve sale-time details | Separate discovery/authorization; no detailed tasks activated |

## Project after accepted MN-01

| Area | Intended available capability | Still outside this increment |
| --- | --- | --- |
| Business/access | Existing installation identity, login, staff administration, fixed-role RBAC and branch grants reused by Menu | Multi-branch operation and deferred BA release checks |
| Menu administration | APIs configure sizes/prices, optional extras, fixed/selectable combos and active state | Visual editor/settings screen; branch overrides |
| Staff selection | APIs list current choices and resolve exact price/composition | Cashier screen, cart, order or guaranteed future price |
| Integration | Menu Nest module with owned application rules, HTTP/persistence boundaries and focused evidence | Kitchen, payments, receipts, inventory movements and trading reports |

Orders is the next business-module objective, with sale snapshots and tax applicability resolved at the affected integration boundary. Neither Menu acceptance nor configuration APIs establish operational POS readiness.
