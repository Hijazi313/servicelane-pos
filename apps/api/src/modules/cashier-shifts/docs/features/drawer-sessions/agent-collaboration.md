# Cashier Shifts — agent collaboration

Specification: [drawer sessions](spec.md). Progress: [phase tracker](phase-tracker.md). Coordinator/integrator: root agent.

| Assignment | Owner | File ownership | Dependencies |
| --- | --- | --- | --- |
| Drawer operations and focused tests, CS-A01–A08 | cashier_service | Cashier application, domain and infrastructure | Agree service contract with HTTP owner; preserve transaction-scoped settlement capability |
| HTTP boundary and isolated module composition | cashier_http | Cashier HTTP, module and public exports | Coordinate service contract; export `CashierSettlementService` for Billing |
| Atomic settlement and compatible retry | billing_integration | Billing files and focused Billing tests | Use exported cashier settlement capability in existing authorized transaction |
| Integration, migration, documentation, Git and checks | root agent | Shared schema entry point, migration, trackers and shared documentation | Integrate and review all changes; serialize Git and shared files |

Shared checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, branch `codex/cashier-shifts`, base `main` / `9cbbb9a`. Root owns branch/index, migration metadata and shared contracts; agents coordinate interfaces before dependent edits. Combined-diff integration; no shared database, installation, deployment or publication is authorized. Existing staged planning work and untracked evidence remain preserved. Each agent reports changes, checks and evidence limits; acceptance remains separate.

## CS-02 offline preparation — 2026-10-29

Shared checkout and boundaries above remain unchanged. Root owns runner integration, case orchestration, shared documentation and Git. `cashier_service` owns only `cs02-controls.mjs` and its offline test; `billing_integration` owns only `cs02-fixtures.mjs`, `cs02-ledger.mjs` and fixture tests; `cashier_http` performs read-only source review. Agents do not access configuration or database, execute migrations, mutate Git or edit shared files. Separate authorization and target reservation remain required for execution.

For CS-02 case preparation, `cashier_service` owns `cs02-drawer-cases.mjs` and its offline test; `billing_integration` owns `cs02-billing-cases.mjs` and its offline test. Both consume coordinator-provided capture/checkpoint and contention hooks; neither implements cleanup or independently claims database proof. Root owns capture, orchestration, restart, shared contracts and Git. Case code is not runnable against a database until the integrated runner, ownership proofs and execution authorization are reviewed.

## CS-02 integration — 2026-10-30

User authorized completing and testing the module. Coordinator owns database execution, shared files, integration and Git. `runner` owns new runner orchestration and tests; `capture` owns new independent write ownership integration and tests; `review` inspects the harness read-only. Agents do not use the database or mutate Git. Preserve existing untracked work and historical ledgers. Coordinate the hook interface before integrating; execute only after fresh target and cleanup checks.
