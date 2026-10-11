# Project Foundation — Specification

Owning context: [architecture](../../architecture/README.md) and [foundation handoff](../../architecture/project-foundation.md).
Specification status: proposed; tooling and implementation scope await user agreement.
Progress and availability: [phase tracker](phase-tracker.md).

## Outcome and scope

Provide a minimal NestJS/Fastify API foundation that later business modules can consume. This is technical foundation work, not a usable POS or an authorization boundary.

| ID | Requirement | Priority | Why needed now / simplest approach |
| --- | --- | --- | --- |
| R-01 | One workspace containing `apps/api`, strict TypeScript and Nest/Fastify bootstrap | Phase P0 | Establish the agreed backend; ordinary workspace scripts suffice without Nx/Turborepo or empty frontend packages. |
| R-02 | Validate required environment configuration before listening; safe example and ignored local secrets | Phase P0 | Prevent ambiguous startup and leaked credentials; use Nest config with one small validation function, not a configuration framework. |
| R-03 | One injected PostgreSQL pool, explicit migration command and clean pool shutdown | Phase P0 | Give subsequent modules a repeatable persistence boundary; no business schema or generic repository. |
| R-04 | Minimal health route, built-in logging and safe framework error responses | Phase P0 | Establish observable startup/database failure behavior; no custom observability stack or error envelope. |
| R-05 | Startup documentation and user-run acceptance instructions | Phase P0 | Operational claims require reproducible evidence; source inspection alone cannot establish readiness. |

## Rules and ownership

- Nest controllers/modules/providers own HTTP and composition. Root infrastructure owns configuration and database lifecycle. Create only directories with actual behavior.
- No business rules, tenant tables, restaurant defaults, demo users or empty business modules. Module-specific queries/migrations will belong to their owning modules when introduced.
- Database transactions must use one checked-out client throughout; no transaction operations distributed through pool queries.
- No automatic schema synchronization or migrations during API startup. Migrations run explicitly against a deliberately selected database.
- Basic connection setup is permitted only after implementation authorization; business persistence and access remain gated on isolation/deployment decisions. This clarifies the architecture guardrail without choosing a tenancy model.
- No tax/payment/privacy compliance certification is claimed by this foundation; it stores no business or customer data. Reassess obligations when affected workflows enter scope.

## Intended contracts and failure behavior

All contracts below are proposed and unavailable.

- Configuration: `DATABASE_URL` required; validate PostgreSQL URL structure without printing credentials. Default `HOST=127.0.0.1`, `PORT=3000`, and development environment; validate port range and supported environment values. Explicit LAN binding is a deployment choice, not a default exposure.
- Invalid configuration exits nonzero before listening, naming invalid fields without their secret values.
- `GET /health`: unauthenticated technical endpoint; perform a read-only `SELECT 1` through the application pool. Return HTTP 200 with `{"status":"ok"}` when successful; HTTP 503 with `{"status":"unavailable"}` on connection/query failure. Bound the total operation to 3 seconds, including connection acquisition, and release resources on every path. No credentials, SQL details, hostnames or tenant data in responses.
- This endpoint means API plus database reachability only. It does not prove migration currency, business readiness or authorization. Separate liveness endpoint and Terminus dependency are deferred.
- Syntactically valid configuration with an unavailable database permits the HTTP server to start and report 503. Shutdown closes the HTTP server and pool using Nest lifecycle hooks.
- Use Nest built-in logger and default exception handling where sufficient. Unexpected HTTP failures return a generic 500; unknown routes return 404. Never return raw database errors or deliberately log environment dumps, credentials, request bodies or authorization headers. Add a custom filter only if source review demonstrates a concrete gap.
- Migration tooling may own its history table. No permanent demonstration schema or fake business migration. Prove migration execution with a disposable fixture in a dedicated acceptance database, then remove the fixture from the delivered migration set.

## Acceptance examples

Required evidence is user-run unless stated otherwise. No result has been established.

### AC-01 — Workspace and bootstrap

R-01: From a fresh checkout, follow the documented pinned-runtime/package-manager install, build and start steps. API starts using Nest's Fastify adapter. Source review confirms no standalone Fastify routes, empty business modules or frontend scaffold. Record exact versions, commands and output.

### AC-02 — Configuration failures

R-02: Start with missing DATABASE_URL, malformed URL and invalid PORT in turn. Each attempt exits nonzero before listening and identifies the field without exposing its value. A valid local environment starts. Confirm example contains placeholders only and local secrets are ignored.

### AC-03 — Database and migrations

R-03: Against an explicitly disposable database, apply a reversible migration fixture, confirm its schema effect and history, rerun up without reapplying, then revert and confirm removal. On a failed fixture, confirm nonzero exit and no successful history entry; transactional fixture changes roll back. Remove fixture afterward. Never use the Odoo database. Confirm shutdown releases pool connections. A no-op migration run alone does not prove migrations work.

### AC-04 — Health and errors

R-04: With database reachable, call GET /health and observe the defined 200 body. Make the dedicated database unavailable and repeat: observe the defined 503 within 3 seconds; restore it and observe recovery without API restart. Unknown route returns 404. Use a temporary acceptance-only throwing handler to confirm generic 500 and credential-free output/logging; remove it afterward. Source inspection confirms only the technical health route is public.

### AC-05 — Repeatable handoff

R-05: A user follows the documented sequence from a clean checkout using an isolated local database. Record commands, versions, outcomes and limits against AC-01 through AC-04. No foundation acceptance until required outcomes have evidence.

## Proposed tooling and trade-offs

Recommendations, not confirmed choices. Official documentation reviewed 2026-10-11; exact package pins and peer/engine metadata must be reviewed before installation, without executing checks under the current policy.

| Choice | Recommendation | Material alternative / cost |
| --- | --- | --- |
| Workspace | pnpm native workspaces; one root lockfile, pinned packageManager | npm workspaces avoids an extra package manager. Nx/Turborepo provide no demonstrated benefit for one API. [pnpm workspace documentation](https://pnpm.io/workspaces) describes the native workspace file. |
| Runtime/framework | Node 24 LTS, current compatible Nest 12 core/adapter/CLI and TypeScript 6; exact patches pending | Use the supported adapter dependency range, not an independently selected Fastify major. Nest companion packages have their own versions. [Node release status](https://nodejs.org/en/about/previous-releases) and [Nest migration guide](https://docs.nestjs.com/migration-guide) support the baseline; Nest CLI requires at least Node 24.15 on the 24 line. These facts do not prove this project's startup. |
| Persistence | `pg` pool plus `node-pg-migrate`; SQL-oriented migrations | Explicit SQL and row mapping require discipline; Prisma offers generated query types but adds schema/code generation. No ORM is required by the current scope. [Transaction documentation](https://node-postgres.com/features/transactions), [migration tooling](https://salsita.github.io/node-pg-migrate/). Exact compatible versions pending. |
| Database | PostgreSQL 18, supported minor pinned at implementation | No established database compatibility constraint in this repository. [Official support policy](https://www.postgresql.org/support/versioning/) lists major 18 as supported; no server was inspected. |
| Local provisioning | A separate database-only Compose service if Docker is already the user's preference | A user-managed PostgreSQL instance avoids a Docker dependency. Compose must use a distinct project/volume, loopback-only configurable port and no Odoo resources; do not assume Docker is installed or running. |

## Open decisions and risks

Before implementation: agree package manager, SQL tooling versus ORM, version baseline, local database provisioning and R-01–R-05 scope. Exact pins are not yet a validated dependency matrix.

Before Business/Branch and Authentication/Access: decide isolated installations/databases versus shared hosting and enforcement. Recommend evaluating isolated restaurant-local deployments first because the architecture requires LAN operation without internet; this is a proposal, not an approved topology or a synchronization design.

## Deferrals and completion shape

P1 for this foundation: OpenAPI UI, request tracing, custom JSON log stack, metrics, separate liveness/readiness probes, CI orchestration, API containerization and workspace task caching. None is needed to establish this small boundary; reconsider against later consumers or deployment requirements.

Later-phase product work (not downgraded to P1): Business/Branch, Authentication/Access, Menu and remaining business modules. Also excluded: frontend, payments, printing, synchronization, production deployment, purchases and Odoo changes.

After acceptance, subsequent modules can consume a Nest application composition point and injected database pool with an explicit migration workflow. No business API, identity or tenant enforcement will exist. This foundation must not be exposed as an operational POS.
