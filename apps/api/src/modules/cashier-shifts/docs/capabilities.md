# Cashier Shifts capability index

CS-01/CS-02 isolated backend development scope is user-accepted and closed on 2026-10-31. Routes are mounted in AppModule; [tracker](features/drawer-sessions/phase-tracker.md#current-handoff) owns PostgreSQL evidence and release limits.

| Capability | Public entry point | Purpose | Constraints |
| --- | --- | --- | --- |
| Drawer management | [DrawerController](../http/drawer.controller.ts) `POST/GET /api/v1/cash-drawers` | Create and list branch drawers | Creation requires administrator access; maximum 100 drawers per branch |
| Drawer sessions | [DrawerController](../http/drawer.controller.ts) `POST /api/v1/cash-drawers/:drawerId/sessions`, `GET /api/v1/cash-drawer-sessions/current`, `GET /api/v1/cash-drawer-sessions/:sessionId` | Open and read cashier sessions | Staff access; opening requires current authorization and a valid drawer |
| Cash movements and close | [DrawerController](../http/drawer.controller.ts) `POST /api/v1/cash-drawer-sessions/:sessionId/movements`, `POST /api/v1/cash-drawer-sessions/:sessionId/close` | Record cash movements and close a session | Session custody and revision rules apply; correction workflows remain a release concern |
| Handover | [DrawerController](../http/drawer.controller.ts) `POST /api/v1/cash-drawer-sessions/:sessionId/handovers` and `POST /:handoverId/accept` or `/cancel` | Start, accept or cancel a session handover | Staff access; custody and revision rules apply |
| Cashier policy | [DrawerController](../http/drawer.controller.ts) `GET/PUT /api/v1/cash-drawer-policy` | Read or replace the branch cashier policy | Staff read; administrator update |
| Atomic cash attribution | [CashierSettlementService](../public.ts) | Admit an actor's cash payment to an open session in the caller's authorized transaction | Billing checks successful retry first; no nested authorization; current custody, currency and handover checks; bounded PostgreSQL contention/rollback evidence on one disposable target |

[Integration guide](features/drawer-sessions/frontend-integration.md) describes client behavior and current limits.
