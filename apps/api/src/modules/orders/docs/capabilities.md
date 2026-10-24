# Orders capability index

OR-01 source is implemented with focused offline and bounded PostgreSQL integration evidence. Migration 0004 is applied on the authorized testing target; atomicity, scoped isolation, retries and fresh-API-process readback passed. Explicit user acceptance was recorded on 2026-10-21 for the bounded backend development scope; no production/recovery claim. [Evidence and limits](features/capture/phase-tracker.md).

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Capture takeaway order | [OrdersController](../http/orders.controller.ts) `POST /api/v1/orders` | Exact merchandise/customer/instruction snapshot and scoped retry identity | Staff + existing session/CSRF; trusted business/branch; current Menu validation; atomic aggregate; no tax/payable/dispatch claim |
| Read captured order | [OrdersController](../http/orders.controller.ts) `GET /api/v1/orders/:id` | Read immutable saved history | Staff, scoped business/branch lookup; no listing/search or live Menu re-resolution |
| Capture limits | [OrdersController](../http/orders.controller.ts) `GET/PUT /api/v1/orders/capture-policy` | Business-scoped defaults and revision-checked configuration | Staff read; administrator + CSRF update; configurable within 500 lines/1,000 units; does not alter history or byte safeguards |

Only OrdersModule is supported for cross-module composition; no foreign persistence or order mutation service is exported.

## HTTP contract adoption — 2026-10-25

POST `/api/v1/orders` now returns `{data: OrderSnapshot, meta: {requestId}}` with 201 and Location for both initial creation and replay. Matched-route failures use root-relative RFC 9457 problems and selected price-confirmation details; unexpected failures use safe 500. Existing GET/policy routes remain legacy. Retry identity, transaction and saved snapshot limits are unchanged.

[Migration contract and evidence](../../../../../../docs/architecture/shared-http-pattern-proposal.md#first-application-integration--prepared-2026-10-25). Source/offline integration only; no database rerun or deployment.

HTTP inputs now use CreateOrderDto through Nest ValidationPipe/class-validator/class-transformer. Unknown nested fields and invalid types return `/problems/validation-failed` with safe `errors` entries; application/domain normalization and raw non-HTTP validation remain. Numeric strings are not implicitly converted.
