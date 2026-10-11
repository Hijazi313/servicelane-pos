# Project foundation — next-chat handoff

## Objective and authorization

Establish the project foundation before Business/Branch or Authentication/Access implementation. User direction on 2026-10-11 approves this sequencing and preparation of this handoff. This handoff does not itself authorize scaffolding, dependency installation or implementation; the next request must establish that scope.

Progress is owned by [the global tracker](../planning/TRACKER.md). This document holds foundation scope and startup context, not a second tracker. The [foundation specification](../planning/project-foundation/spec.md) now owns proposed scope, tooling and acceptance criteria; the [phase tracker](../planning/project-foundation/phase-tracker.md) owns detailed progress. The sections below retain the original planning context; use the specification for the current proposal.

## Confirmed context

- Node.js, TypeScript, NestJS with `@nestjs/platform-fastify`, PostgreSQL; modular monolith in a monorepo. React versus Next.js remains deferred.
- No application scaffold is established in this conversation. Inspect repository state before acting; do not assume the handoff is a live inventory.
- Multiple independent restaurant businesses are the product target; Chickano is the first deployment. Business → Branch foundation is required, with one operational branch per business in MVP and multiple-branch workflows deferred.
- Project foundation comes first; Business/Branch and Authentication/Access follow together, then Menu. Do not create placeholder business modules merely to fill folders.
- The Odoo pilot at `/Users/macbookpro/Documents/personal/restaurant-pos` must remain untouched. It is a reference, not a production-ready implementation or a required dependency.

## Proposed foundation P0

1. Minimal monorepo/workspace configuration and TypeScript API setup.
2. NestJS bootstrap with the Fastify adapter and standard Nest modules/controllers/providers.
3. Validated configuration and a safe example environment file; no committed secrets.
4. PostgreSQL connection and migration tooling, without speculative business schemas. Keep connection setup separate from module-specific persistence.
5. Basic logging, consistent safe errors and a health endpoint with explicitly defined semantics.
6. Minimal architecture-aligned directories, startup instructions and user-run acceptance criteria.

Challenge each item before expanding it. Existing Nest behavior may suffice; avoid building a logging/error framework or mandatory layers with no behavior. Decide whether local database provisioning is needed; do not alter the pilot's services or volumes.

## Open decisions

- Package manager/workspace tooling: not selected. Prefer the simplest suitable option; present a recommendation with rationale.
- PostgreSQL client/ORM and migration tooling: not selected. Assess Nest integration, transactions, migrations and maintenance without claiming one choice is mandatory industry practice.
- Supported runtime versions and dependency versions: verify official current support information when selecting them.
- Deployment/vendor isolation: still unresolved. Basic connection setup need not invent a tenant schema; resolve isolation before business persistence/auth implementation.
- Agent-run verification policy: tests, builds, lints and runtime/device checks remain prohibited unless explicitly changed. Installation does not imply permission to run lifecycle scripts or checks; explain relevant commands before execution and respect sandbox approvals.

## Boundaries and evidence

Do not implement business logic, authentication, branch workflows, frontend, synchronization, generic repositories, event infrastructure or speculative abstractions in this phase. Do not install or run anything merely to prepare a plan.

Source inspection can establish wiring and file contents, not a working server or database connection. User-run acceptance must demonstrate startup, configuration failure behavior, defined health behavior and migration behavior before corresponding success claims. Record implemented-but-unverified status accurately.

## Next-chat prompt

> Start the project foundation phase for this repository. Read root/applicable AGENTS.md, docs/project-scope.md, docs/planning/TRACKER.md and this handoff, then use the spec-driven-delivery skill. Load architecture sections and supporting documents only where relevant. Inspect current repository state and preserve unrelated work.
>
> First recommend the package manager and PostgreSQL persistence/migration tooling, identify material unresolved choices, and prepare the smallest P0 foundation specification with acceptance-linked tasks and completion shape. This initial instruction authorizes planning only; resolve those choices and implementation scope with me before scaffolding or installation. Do not ask again about decisions already confirmed in the handoff.
>
> Use NestJS with its Fastify adapter, TypeScript and PostgreSQL in a minimal monorepo. Follow the proposed scope above and challenge unnecessary complexity. Keep global phase state in the global tracker and detailed foundation state in one canonical spec/tracker location under global docs; foundation has no owning business module. Do not create a new planning system.
>
> Respect the prohibition on agent-run tests, builds, lints and runtime/device checks. Prepare user-run acceptance instructions, distinguish source evidence from operational evidence, and never claim unverified success. If code and documentation disagree, report and resolve the discrepancy. Keep communication concise: decisions, blockers, outcomes and one next action.
