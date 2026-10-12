---
name: spec-driven-delivery
description: Scope modules and substantial features, define specifications and phases, and coordinate evidence-based delivery and handoffs in this repository. Use for planning, phase transitions or agent assignments; do not create packs for small isolated fixes.
---

# Spec-driven delivery

## Routing

1. Read root and applicable scoped AGENTS.md instructions; locate current work in `docs/planning/TRACKER.md`.
2. Find the owning module's existing documentation. Reuse it rather than creating parallel specifications or trackers.
3. Read [workflow guidance](references/workflow.md) when planning, changing phases or coordinating agents. For ordinary work, load only the assigned phase and relevant specification sections and decisions.

## Phase entry, resume and closeout

Follow the entry/resume and closeout gates in [workflow guidance](references/workflow.md) at phase transitions. Work from acceptance-linked tasks; links identify targets, not evidence. Retrieve relevant sections deliberately, including affected invariants and dependencies; do not bulk-load every linked document or guess from a criterion alone.

## Ownership

- Global `docs/`: product scope, architecture, compliance and global tracking.
- `apps/api/src/modules/<module>/docs/README.md`: module boundaries and feature/phase index.
- `<module>/docs/features/<feature>/spec.md`: intended behavior and acceptance criteria.
- `<module>/docs/features/<feature>/phase-tracker.md`: active phase, progress, evidence and current handoff.

The spec and tracker are the default pair for substantial features. Small features can stay in the module plan. Create supporting documents when relevant: `frontend-integration.md` before frontend integration, `agent-collaboration.md` for multiple-agent delivery, and `decisions.md` when material feature-specific choices arise. They are first-class documents, not mandatory empty files. A separate risk register remains optional. Do not scaffold application modules merely to hold empty plans.

## User prompts

When composing a startup/continuation prompt or explaining the delivery sequence, use [prompt examples](references/prompts.md). Do not load this guide during ordinary implementation.

## Templates

Load only the template needed for the current document:

- [Module plan](templates/module.md)
- [Feature specification](templates/feature-spec.md)
- [Feature phase tracker](templates/phase-tracker.md)
- [Frontend integration](templates/frontend-integration.md)
- [Agent collaboration](templates/agent-collaboration.md)
- [Feature decisions](templates/decisions.md)

## Constraints

Challenge P0 scope using `docs/decision-making.md`. Resolve blocking choices instead of inventing answers. Specify intended behavior before implementation; approved contracts are not claims of availability.

Keep progress in trackers and lasting behavior in specifications. Link canonical schemas and decisions rather than copying them. Source review cannot establish runtime, hardware or recovery success. Pending required acceptance remains explicit; follow the verification policy in repository `docs/project-scope.md#verification-policy`.

This skill defines project conventions, not an industry-mandated file layout. It does not authorize implementation, external actions or scope expansion.
