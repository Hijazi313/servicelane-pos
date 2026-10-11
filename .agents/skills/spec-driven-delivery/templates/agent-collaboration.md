# <Feature name> — Agent collaboration

Specification: [spec.md](spec.md)
Active work and handoff: [phase-tracker.md](phase-tracker.md)
Coordinator/integrator: <Owner>

## Assignment boundaries

| Assignment / outcome | Owner | Allowed files or responsibilities | Dependencies / shared changes |
| --- | --- | --- | --- |
| <Approved work; link phase/criteria> | <Agent/person> | <Exclusive scope> | <Prerequisite and coordination owner> |

## Checkout and integration

- Mode: <Shared checkout / separate worktrees; use existing environment where suitable>
- Checkout paths and branch/base: <Per owner; do not assume chat isolation>
- Shared-state owners: <Git branch/index operations, manifests/lockfile, migrations/contracts as relevant>
- Integration method/order: <Combined-diff review or branch integration; integrator owns it>
- Runtime resources: <Separate disposable database/ports if relevant; otherwise not applicable>

Follow the checkout/integration rules in the skill workflow. Do not duplicate task status here.

## Required context

<Link only relevant spec sections, scoped instructions, contracts and decisions per assignment. Do not require reading every feature document.>

## Coordination

- Assign one owner for shared schemas, migrations, module wiring and tracker updates. Name owners only for shared changes that actually exist.
- Parallelize independent assignments after contracts are agreed. Serialize conflicting edits; coordinate before expanding file ownership.
- Respect root/scoped instructions and verification restrictions. An assignment does not authorize extra features or acceptance claims.
- Return changed files, decisions, evidence/limits and remaining work to the coordinator. Keep the current handoff in the tracker, not here.
