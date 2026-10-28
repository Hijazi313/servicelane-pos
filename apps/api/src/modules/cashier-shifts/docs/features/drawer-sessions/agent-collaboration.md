# Cashier Shifts — agent collaboration

Specification: [drawer sessions](spec.md). Progress: [phase tracker](phase-tracker.md). Coordinator/integrator: root agent.

| Assignment | Owner | File ownership | Dependencies |
| --- | --- | --- | --- |
| Drawer operations and focused tests, CS-A01–A08 | cashier_service | Cashier application, domain and infrastructure | Agree service contract with HTTP owner; preserve transaction-scoped settlement capability |
| HTTP boundary and isolated module composition | cashier_http | Cashier HTTP, module and public exports | Coordinate service contract; export `CashierSettlementService` for Billing |
| Atomic settlement and compatible retry | billing_integration | Billing files and focused Billing tests | Use exported cashier settlement capability in existing authorized transaction |
| Integration, migration, documentation, Git and checks | root agent | Shared schema entry point, migration, trackers and shared documentation | Integrate and review all changes; serialize Git and shared files |

Shared checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, branch `codex/cashier-shifts`, base `main` / `9cbbb9a`. Root owns branch/index, migration metadata and shared contracts; agents coordinate interfaces before dependent edits. Combined-diff integration; no shared database, installation, deployment or publication is authorized. Existing staged planning work and untracked evidence remain preserved. Each agent reports changes, checks and evidence limits; acceptance remains separate.
