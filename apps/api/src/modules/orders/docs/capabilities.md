# Orders capability index

OR-01 source is implemented with focused offline evidence. Migration 0004 is generated, not applied; PostgreSQL persistence/concurrency/restart and user acceptance remain pending. [Evidence and limits](features/capture/phase-tracker.md).

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Capture takeaway order | [OrdersController](../http/orders.controller.ts) `POST /api/v1/orders` | Exact merchandise/customer/instruction snapshot and scoped retry identity | Staff + existing session/CSRF; trusted business/branch; current Menu validation; atomic aggregate; no tax/payable/dispatch claim |
| Read captured order | [OrdersController](../http/orders.controller.ts) `GET /api/v1/orders/:id` | Read immutable saved history | Staff, scoped business/branch lookup; no listing/search or live Menu re-resolution |
| Capture limits | [OrdersController](../http/orders.controller.ts) `GET/PUT /api/v1/orders/capture-policy` | Business-scoped defaults and revision-checked configuration | Staff read; administrator + CSRF update; configurable within 500 lines/1,000 units; does not alter history or byte safeguards |

Only OrdersModule is supported for cross-module composition; no foreign persistence or order mutation service is exported.
