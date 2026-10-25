# Kitchen capability index

Kitchen dispatch, queue/read and state transitions are implemented. PostgreSQL K01–K04 evidence and final frozen-build D01 passed; KT-02 technical verification is complete. Operational and user acceptance are pending. See the [tracker](features/preparation/phase-tracker.md) for evidence and limits.

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Dispatch captured order | [KitchenController](../http/kitchen.controller.ts) `POST /api/v1/kitchen/tickets` | One preparation-only ticket per authorized branch/order | Staff/admin + current session/CSRF; trusted Orders projection in same authorized transaction; no payment prerequisite; retries preserve current state |
| Queue summaries and ticket read | [KitchenController](../http/kitchen.controller.ts) `GET /api/v1/kitchen/tickets`, `GET /:id` | Finite position-fenced pages and full preparation read | Current business/branch; default 25/max 100 summaries; signed cursors bind scope/limit and expire on API restart; ready retained; no customer/money data; full-ticket response limited to 1 MiB with future timestamp reservation |
| Preparation state | [KitchenController](../http/kitchen.controller.ts) `PUT /:id/state` | queued→preparing→ready with expected revision | Staff/admin + CSRF; immediate same-target retry supported; delayed/stale conflict; actor stamps internal, no backward/amend/cancel |

Only KitchenModule is exported for composition; no Kitchen application provider or persistence interface is exposed across modules.

## REST API adoption

All four ticket routes adopted [REST API skill v0.4.0](../../../../../../.agents/skills/rest-api-contracts/SKILL.md) on **2026-10-25**. See the [contract](features/preparation/spec.md#rest-api-adoption--2026-10-25) for behavior and compatibility, and the [adoption record](features/preparation/phase-tracker.md#rest-api-adoption-result--2026-10-25) for the exact baseline, verification and limits. Reassess affected routes when the skill or convention changes.
