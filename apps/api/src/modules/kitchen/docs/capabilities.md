# Kitchen capability index

KT-01 source has focused offline application/actual-HTTP and synthetic SQL evidence only; migration 0005 is generated and **unapplied**. No PostgreSQL persistence/restart/concurrency, operational or user acceptance is claimed. [Tracker](features/preparation/phase-tracker.md) owns authorization/evidence.

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Dispatch captured order | [KitchenController](../http/kitchen.controller.ts) `POST /api/v1/kitchen/tickets` | One preparation-only ticket per authorized branch/order | Staff/admin + current session/CSRF; trusted Orders projection in same authorized transaction; no payment prerequisite; retries preserve current state |
| Queue summaries and ticket read | [KitchenController](../http/kitchen.controller.ts) `GET /api/v1/kitchen/tickets`, `GET /:id` | Finite position-fenced pages and full preparation read | Current business/branch; default 25/max 100 summaries; ready retained; no customer/money data; full-ticket response limited to 1 MiB with future timestamp reservation |
| Preparation state | [KitchenController](../http/kitchen.controller.ts) `PUT /:id/state` | queued→preparing→ready with expected revision | Staff/admin + CSRF; immediate same-target retry supported; delayed/stale conflict; actor stamps internal, no backward/amend/cancel |

Only KitchenModule is exported for composition; no Kitchen application provider or persistence interface is exposed across modules.
