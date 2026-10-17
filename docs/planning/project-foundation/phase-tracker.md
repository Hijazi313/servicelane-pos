# Project Foundation — Phase tracker

Parent: [global tracker](../TRACKER.md). Specification: [spec.md](spec.md).
Owner: primary backend agent. Status: complete (development foundation accepted).
Closed phase: F-01 on 2026-10-12; revised acceptance scope and user closeout recorded below.

## Phase authorization

User instruction “let's get this done” on 2026-10-11 authorizes F-01 implementation of R-01–R-05 following the hosted-development proposal. Core tooling and hosted direction are agreed; local provisioning and Compose are excluded. Source implementation and dependency preparation are authorized. At implementation time, agent-run tests, builds, lints, lifecycle scripts and runtime/device checks were prohibited. Current verification follows the policy update below. No database access or provider provisioning was performed.

## Verification policy update — 2026-10-11

The user replaced the blanket ban with [focused verification](../../project-scope.md#verification-policy). Existing evidence below is historical and unchanged; this documentation update ran no code checks. Required acceptance remains pending. The policy change does not itself authorize hosted database writes, provider provisioning or broader acceptance execution.

## Assignment

Foundation delivery owner: primary backend agent. Implementation branch `codex/project-foundation` was squash-merged and deleted; current checkout/handoff details are below. No business implementation assignment is active.

## Feature phase tracker

| Phase | Outcome | Status | Exit criteria | Evidence |
| --- | --- | --- | --- | --- |
| F-00 | Reviewable proposal and agreed implementation boundary | complete | User authorization | User instruction dated 2026-10-11 after hosted-development revision |
| F-01 | Minimal API/database foundation | complete | [AC-01](spec.md#ac-01--workspace-and-bootstrap) through [AC-05](spec.md#ac-05--repeatable-handoff) | Accepted under revised schema-free scope; see closeout below |

## Closeout — 2026-10-12

User challenged the fixture-heavy acceptance process, accepted deferring migration application to the first real schema and instructed “let's close this”. This explicitly revises the phase exit criteria; deferred checks are not claimed as passed.

| Criterion | Accepted evidence | Limits / follow-up owner |
| --- | --- | --- |
| AC-01 | API/config typechecks, synthetic watch check and user-run API startup | Pinned-toolchain clean installation: build/release preparation |
| AC-02 | Configuration source review, TLS default/override/invalid-value checks and observed certificate rejection | Trusted TLS before production; local verification currently disabled |
| AC-03 | Successful authentication/read-only Drizzle query, offline SQL generation and migration/shutdown source review | Apply/repeatability/recovery: first real migration; runtime session release: deployment validation |
| AC-04 | Observed 200/503 health responses and 404; deadline/resource/error source review | Fault recovery and runtime shutdown: deployment validation; no injected error route required |
| AC-05 | README and revised acceptance record; explicit user acceptance | No production-readiness claim |

No new runtime checks, database writes, staging deployment, Git commit or push were performed during closeout. Existing staged work is preserved. No business phase is activated.

## Completion shape

Implemented source provides a Nest composition point, `DatabaseModule` exporting `DatabaseService` with one injected pool, explicit Drizzle migration runner and technical health controller. Configuration verifies hosted TLS by default; the explicitly approved staging override is documented in the specification. No business schemas, identity/access, frontend, Docker, provisioning or provider SDK exists. This is not an accepted/running POS. The foundation gate is closed; business implementation remains gated on a vendor-isolation decision and approved module specifications.

## Initial implementation evidence (historical; superseded by closeout)

2026-10-11 entry source inventory found no backend source or existing capability to reuse; four foundation planning files already had local changes. Relevant architecture and delivery guidance were read. Source review of the implementation and pinned dependency types established intended wiring only.

| Acceptance | Source implementation | Evidence and limits |
| --- | --- | --- |
| AC-01 | Root package/workspace/lockfile, API tsconfig, main and app module | Source present; no compiler or startup execution |
| AC-02 | Shared `infrastructure/configuration.ts` and sanitized root `.env.example` | Source validates fields, requires verified TLS and rejects URL parameters; negative behavior unrun |
| AC-03 | `database.service.ts`, `database.module.ts`, `migrate.ts`, migration README | Source uses one pool, explicit transactional runner and shutdown hook; no database connected or migration executed |
| AC-04 | `health.controller.ts` and database reachability deadline | Source defines 200/503, disposes timed-out clients and handles idle errors; latency, recovery and shutdown unverified |
| AC-05 | Root README and [acceptance instructions](../../acceptance/project-foundation.md) | User-run instructions prepared; all behavioral outcomes pending |

Direct versions selected from official npm metadata: Nest core/common/adapter 12.1.2, Nest config 12.0.1, pg 8.23.1, node-pg-migrate 9.0.0, TypeScript 6.0.3, reflect-metadata 0.2.2, RxJS 7.8.2 and types recorded in the manifest. Adapter metadata owns Fastify 5.12.5. Node 24.21.0 was selected from the official Node 24 distribution listing; pnpm 12.11.2 is pinned.

Dependency resolution/download completed using the machine's existing pnpm 9.15.0 with lifecycle scripts disabled and automatic package-manager switching disabled. It reported Node 24.18.1, below the selected project floor; no global tooling was changed. Lockfile format is 9.0. A frozen install with the pinned pnpm version, compilation and runtime compatibility are still user-run acceptance requirements. No tests, builds, lints, database queries, migrations or runtime/device checks ran.

## Drizzle integration — 2026-10-11

Authorization: user instruction “let's make this project work with drizzle”. Replaces node-pg-migrate within F-01, without business schema or database provisioning. The existing staged work and deleted architecture handoff remain preserved; no stage, commit or push performed.

- Implemented Drizzle ORM 0.45.4 on the existing pool and health query, credential-free Drizzle Kit 0.31.11 configuration/schema entry point, and explicit TLS-aware ORM migrator. Removed the down command; documented forward corrections and serialized execution. Empty migration sets avoid database access.
- Dependencies/lockfile updated with lifecycle scripts disabled. Machine remains Node 24.18.1/pnpm 9.15.0; pinned Node 24.21.0/pnpm 12.11.2 installation compatibility remains pending.
- Passed API `tsc -p tsconfig.json --noEmit` and strict standalone config typecheck using existing TypeScript. No production build ran.
- Passed offline CREATE then corrective DROP SQL generation with two journal entries using a temporary synthetic schema and a copy of the project config. Temporary files were removed. Test harness corrections were needed for TypeScript 6's `--ignoreConfig` option, Drizzle Kit's config/CLI exclusivity and relative output paths; the delivered config already uses relative paths.
- Reviewed pinned migrator source: pending SQL/history entries share a transaction; creation of Drizzle's history schema/table precedes it and can remain after failure. No advisory lock is provided. No database query, migration application, TLS connection, HTTP startup or shutdown acceptance ran.

This supersedes the earlier no-compiler evidence for AC-01 and establishes offline generation for AC-03; database and full behavioral acceptance remain pending.

## Current handoff — 2026-10-12

### Completed work and evidence

Foundation F-01 is accepted under the explicitly revised schema-free scope. [Closeout](#closeout--2026-10-12) records evidence per criterion; [acceptance record](../../acceptance/project-foundation.md) owns the concise validation limits. Implemented Nest/Fastify startup, Drizzle/pool/TLS configuration, health, watch mode, explicit migration workflow and module persistence/API boundaries. Typechecks, offline generation/configuration/watch checks and observed hosted read-only/HTTP behavior are recorded above and in the dated evidence below; no migration application is claimed.

Git delivery completed: [PR #2](https://github.com/Hijazi313/servicelane-pos/pull/2) squash-merged as `a725fd3d70f878804f5e290d7a7089247374564e`; required Conventional PR title check passed and no merge conflict was reported. Local `main` was fast-forwarded; foundation branch deleted locally/remotely. No application CI suite exists; the title check is not code-validation evidence.

### Transition to new planning

F-01 remains closed. Current vendor-isolation planning, versioning/Swagger follow-ups, authorization and checkout cautions now belong to the [global tracker](../TRACKER.md#current-planning-handoff--2026-10-12), following the revised delivery workflow. Topology was subsequently approved on 2026-10-12; joint specification planning is linked from the global tracker. Subsequent BA-01 authorization and evidence belong to the joint tracker; F-01 is not reopened.

### Remaining work, blockers and acceptance

- No remaining P0 work or pending acceptance within revised F-01 scope. Subsequent [BA-01 staging acceptance](../business-access/phase-tracker.md#closeout--2026-10-12) fulfilled first-real-migration application/repeatability and additive-DDL rollback recovery; PostgreSQL 17.11 was observed. Deployment/release preparation still owns operational shutdown/fault recovery, pinned-toolchain clean installation, provider mode/budget and target-version suitability; production requires trusted TLS. Backup/restore and future migration risks remain outside that limited recovery evidence. See the acceptance record.
- Foundation closeout does not authorize a subsequent implementation phase; current planning authorization is owned by the global tracker linked above.

## Running API check — 2026-10-11

User authorized testing the running development server. `GET /health` returned 503 with `{"status":"unavailable"}`; `GET /missing` returned the expected Nest 404. A separate read-only `SELECT 1` diagnostic using the shared built configuration failed TLS verification with `SELF_SIGNED_CERT_IN_CHAIN` after approximately 608 ms (10-second diagnostic connection limit). No query succeeded, migrations ran or data changed; no credentials were printed. Hosted acceptance remains pending. Next: configure the provider-issued CA certificate through `DATABASE_CA_FILE`, restart development mode and repeat health/TLS checks without disabling certificate verification.

## Staging TLS exception — 2026-10-11

User instruction “let's disable this for staging” authorizes an explicit `DATABASE_TLS_VERIFY=false` override for API and migration connections. Default remains true; invalid values fail configuration. TLS encryption remains enabled, but server identity verification is skipped under the override. This switch is deployment configuration, independent of NODE_ENV; production must retain verification. The local development `.env` was not changed, and no staging deployment or database operation was performed.

Focused verification passed: API typecheck, configuration checks for omitted/true/false values on both connections and invalid-value rejection, and diff whitespace check. No network was used by the configuration checks.

## Connection timeout correction — 2026-10-11

User requested renewed diagnosis. Effective local configuration now explicitly disables TLS verification. A read-only connection authenticated successfully and executed SELECT 1. Comparing Drizzle queries reproduced a timeout at the API's 1000 ms limit (1013 ms observed), while a longer diagnostic limit succeeded in 1182 ms. Raised the HTTP pool connection timeout to 2500 ms, retaining the existing 3000 ms health deadline. Focused typecheck and diff check passed. After the development watcher applied the change, GET /health returned 200 with `{"status":"ok"}`. The password is valid for the tested configuration. No migrations or data writes ran. This establishes reachability under the explicit TLS-verification bypass, not verified certificate trust, recovery, migration or full foundation acceptance.
