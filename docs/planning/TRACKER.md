# Global phase tracker

## Current focus

- Stage: Project Foundation complete; user accepted revised schema-free development scope on 2026-10-12.
- Closed phase: Project Foundation F-01; [acceptance and evidence limits](project-foundation/phase-tracker.md#closeout--2026-10-12).
- Current activity: foundation closeout; no business implementation activated.
- Next action: decide vendor isolation/deployment, then specify Business/Branch and Authentication/Access together.
- Deferred validation: migration application with the first real schema; trusted TLS and operational checks before production/deployment. See [acceptance record](../acceptance/project-foundation.md).

## Module roadmap

Project foundation precedes Business/Branch and Authentication/Access, which precede Menu. Detailed increments and later module ordering remain proposed; this roadmap does not authorize implementation. The business foundation is branch-aware with one operational branch per business in MVP. Integration milestones remain required even when modules are developed separately.

| Order | Module | Status | Active phase / plan |
| --- | --- | --- | --- |
| 0 | Project foundation | complete | [Specification](project-foundation/spec.md) / [phase tracker](project-foundation/phase-tracker.md); development foundation accepted; limits recorded |
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
