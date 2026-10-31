# Cashier Shifts capability index

CS-01/CS-02 isolated backend development scope is user-accepted and closed on 2026-10-31. Routes remain unmounted; [tracker](features/drawer-sessions/phase-tracker.md#current-handoff) owns PostgreSQL evidence and release limits.

| Capability | Public entry point | Purpose | Constraints |
| --- | --- | --- | --- |
| Cashier HTTP composition | [CashierShiftsModule](../public.ts) | Branch-scoped drawer, policy, movement, handover and close operations | Explicit composition only; shared Access HTTP boundary required; not in AppModule; maximum 100 drawers per branch |
| Atomic cash attribution | [CashierSettlementService](../public.ts) | Admit an actor's cash payment to an open session in the caller's authorized transaction | Billing checks successful retry first; no nested authorization; current custody, currency and handover checks; bounded PostgreSQL contention/rollback evidence on one disposable target |

[Integration guide](features/drawer-sessions/frontend-integration.md) describes client behavior and current limits.
