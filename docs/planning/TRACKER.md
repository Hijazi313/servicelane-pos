# Global phase tracker

## Current focus

- Stage: discovery and planning; implementation is not active.
- Active phase: project foundation planning; no implementation phase is activated.
- Current activity: prepare the runnable NestJS/Fastify backend foundation before business-module work, per user direction on 2026-10-11.
- Next action: review the [foundation specification](project-foundation/spec.md) and agree tooling/scope; then authorize implementation. Detailed progress: [foundation phase tracker](project-foundation/phase-tracker.md).
- Prerequisites: package manager and database tooling for foundation; vendor isolation/deployment before business persistence and access implementation. Verification permissions remain unchanged.

## Module roadmap

Project foundation precedes Business/Branch and Authentication/Access, which precede Menu. Detailed increments and later module ordering remain proposed; this roadmap does not authorize implementation. The business foundation is branch-aware with one operational branch per business in MVP. Integration milestones remain required even when modules are developed separately.

| Order | Module | Status | Active phase / plan |
| --- | --- | --- | --- |
| 0 | Project foundation | proposed | [Specification](project-foundation/spec.md) / [phase tracker](project-foundation/phase-tracker.md); proposal prepared, setup not implemented |
| 1 | Business/Branch foundation | proposed | P0 direction agreed; detailed plan pending |
| 2 | Authentication and Access | proposed | MVP P0 agreed; plan alongside foundation |
| 3 | Menu | proposed | Follows accepted foundation; plan pending |
| 4 | Orders | proposed | Not activated |
| 5 | Kitchen | proposed | Not activated |
| 6 | Billing and payments | proposed | Not activated |
| 7 | Cashier shifts | proposed | Not activated |
| 8 | Inventory | proposed | Stock model unresolved |
| 9 | Reports | proposed | Not activated |

## Integration and release objectives

- First milestone: accept business/branch provisioning and staff authentication/access together, including unauthorized business/branch access rejection and disabled-account behavior. Exact scenarios await specifications and user-run acceptance.
- After minimum Orders, Kitchen and Billing capabilities exist: accept one complete trading flow, including amendments, reconnect and receipt output.
- Before MVP release: reconcile approved menu behavior, payments, shifts, stock and reports; verify recovery and repeatable isolated business provisioning.
- Detailed checklists remain deferred until the relevant modules enter discovery.
