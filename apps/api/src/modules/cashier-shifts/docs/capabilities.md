# Cashier Shifts capability index

CS-01 isolated source is implemented but unmounted and not PostgreSQL-verified; [tracker](features/drawer-sessions/phase-tracker.md) owns evidence and limits.

| Capability | Public entry point | Purpose | Constraints |
| --- | --- | --- | --- |
| Cashier HTTP composition | [CashierShiftsModule](../public.ts) | Branch-scoped drawer, policy, movement, handover and close operations | Explicit composition only; shared Access HTTP boundary required; not in AppModule; maximum 100 drawers per branch |
| Atomic cash attribution | [CashierSettlementService](../public.ts) | Admit an actor's cash payment to an open session in the caller's authorized transaction | Billing must check successful retry first; no nested authorization; current custody, currency and handover checks; database contention/rollback unverified |

[Integration guide](features/drawer-sessions/frontend-integration.md) describes client behavior and current limits.
