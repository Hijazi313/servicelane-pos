# Cashier Shifts — phase tracker

Specification: [drawer sessions](spec.md); client semantics: [integration guide](frontend-integration.md). Owner/integrator: root agent. Checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, `codex/cashier-shifts`, base `main` / `9cbbb9a`. Git is authoritative for local/remote state. [Assignments](agent-collaboration.md) record shared ownership.

## Authorization and phases

The user authorized CS-01 source implementation, affected docs, focused offline verification and coherent local commits. Database access, migration execution, installation, publication and deployment remain outside the recorded scope. Acceptance is separate. Prior Billing, Kitchen and Orders evidence remains historical; unrelated ledgers are preserved.

| Phase | Status | Outcome |
| --- | --- | --- |
| CS-00 | Business decisions confirmed | Drawer, handover, cash movement, closing and payment attribution scope defined. |
| CS-01 | Source delivered; awaiting review | Isolated drawer API, Billing attribution and migration source; offline evidence below. Routes remain absent from AppModule. |
| CS-02 | Proposed | Bounded PostgreSQL migration, atomicity, race and durable-readback verification; procedure and execution require separate scope and authorization. |

## Current handoff

CS-01 implements branch-scoped drawers, opening, movement, handover, close policy, closing and current/known-session readback. Drawer discovery is bounded to 100 per branch. Billing checks its successful retry first, then attributes a new cash payment to the intended open drawer and inserts the bill in the same Access-authorized transaction. Legacy successful retries remain recoverable without a fabricated session; fresh legacy settlements require a session. No live activation follows. Client-facing breaking admission and recovery semantics are in the [Billing contract](../../../../billing/docs/features/settlement/spec.md#cs-01-settlement-admission-migration).

Source checks on 2026-10-28: strict API TypeScript compilation; cashier domain/service/attribution/HTTP synthetic tests; focused Billing and Access tests; HTTP architecture scan. Exact final results and commits are recorded at handoff below. Offline migration generation created `0007_dark_dagger.sql` and metadata only. No database, environment target, installation, deployment, push or PR action was performed. Existing Node v24.18.1 is below the project runtime pin; checks do not establish behavior under the pinned runtime.

Synthetic stores and HTTP injection do not establish real PostgreSQL migration compatibility, constraints, contention, transaction rollback or restart durability. Read authorization and subsequent storage reads are separate, as in Billing; revocation ordering for reads is unverified. Source is not restaurant-ready: history-preserving correction of mistaken counts, movements or attribution, fiscal/receipt requirements, physical handling and operational recovery remain release blockers. User acceptance is not implied. [INC-20261028-02](../../../../../../../../docs/quality/agent-incidents.md#inc-20261028-02--repeated-review-gates-fragmented-cashier-planning) records earlier interrupted work; review remains pending.

Final focused offline checks: cashier domain/service/HTTP and integrated HTTP-to-service suite, 11 passing cases; Billing suite, 28 passing cases; Access authorization suite, 23 passing cases including subtests; HTTP architecture scan, 34 files and zero findings. Tests use synthetic data and, where applicable, synthetic transaction/store doubles. The generated SQL and snapshot were inspected for six new tables, scoped references, retry keys, cash-sale uniqueness and partial open-session indexes; execution is unverified. Existing Node runtime v24.18.1 was used. No other-module database suite was rerun.
