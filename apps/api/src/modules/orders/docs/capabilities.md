# Orders capability index

OR-01 source is implemented with focused offline and bounded PostgreSQL integration evidence. Migration 0004 is applied on the authorized testing target; atomicity, scoped isolation, retries and fresh-API-process readback passed. Explicit user acceptance was recorded on 2026-10-21 for the bounded backend development scope; no production/recovery claim. [Evidence and limits](features/capture/phase-tracker.md).

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Capture takeaway order | [OrdersController](../http/orders.controller.ts) `POST /api/v1/orders` | Exact merchandise/customer/instruction snapshot and scoped retry identity | Staff + existing session/CSRF; trusted business/branch; current Menu validation; atomic aggregate; no tax/payable/dispatch claim |
| Read captured order | [OrdersController](../http/orders.controller.ts) `GET /api/v1/orders/:id` | Read immutable saved history | Staff, scoped business/branch lookup; no listing/search or live Menu re-resolution |
| Capture limits | [OrdersController](../http/orders.controller.ts) `GET/PUT /api/v1/orders/capture-policy` | Business-scoped defaults and revision-checked configuration | Staff read; administrator + CSRF update; configurable within 500 lines/1,000 units; does not alter history or byte safeguards |

| Preparation projection | [OrderPreparationService via public.ts](../public.ts) | Read captured preparation-only history in the caller’s authorized transaction | KT-01 source extension; no nested authorization/current Menu resolution, customer data, money or persistence export; offline projection checks only; Kitchen/PostgreSQL integration unverified |

OrdersModule exports OrderPreparationService for cross-module composition; no foreign persistence or order mutation service is exported.
