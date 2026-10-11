# Project Foundation — Specification

Owning context: [architecture](../../architecture/README.md). Current authorization, progress and handoff: [phase tracker](phase-tracker.md).
Specification status: approved for F-01 implementation by user instruction “let's get this done” on 2026-10-11. Acceptance is separate; see the phase tracker.
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

Contracts below define the authorized foundation; implementation availability and evidence live in the phase tracker.

- Configuration: `DATABASE_URL` required; validate PostgreSQL URL structure without printing credentials. Default `HOST=127.0.0.1`, `PORT=3000`, and development environment; validate port range and supported environment values. Explicit LAN binding is a deployment choice, not a default exposure.
- Optional `MIGRATION_DATABASE_URL` supplies a separate migration connection; otherwise use `DATABASE_URL`. Validate both when supplied, and keep migration credentials out of the HTTP pool. `DATABASE_CA_FILE` optionally supplies a PEM CA path relative to repository root or absolute. Connection URLs must omit query parameters so they cannot override TLS settings. Hosted connections require TLS. Certificate and hostname verification default to enabled. User-approved staging exception (2026-10-11): explicitly set `DATABASE_TLS_VERIFY=false` in staging configuration; this disables server verification for both API and migrations while retaining encryption. Production configuration must keep verification enabled. Document one consistent TLS configuration path for both client and migration runner, avoiding conflicting URL SSL parameters and client options. Non-TLS local support is deferred; verification is never disabled automatically.
- Invalid configuration exits nonzero before listening, naming invalid fields without their secret values.
- `GET /health`: unauthenticated technical endpoint; perform a read-only `SELECT 1` through the application pool. Return HTTP 200 with `{"status":"ok"}` when successful; HTTP 503 with `{"status":"unavailable"}` on connection/query failure. Bound the total operation to 3 seconds, including connection acquisition, and release resources on every path. No credentials, SQL details, hostnames or tenant data in responses.
- This endpoint means API plus database reachability only. It does not prove migration currency, business readiness or authorization. Separate liveness endpoint and Terminus dependency are deferred.
- Syntactically valid configuration with an unavailable database permits the HTTP server to start and report 503. Shutdown closes the HTTP server and pool using Nest lifecycle hooks.
- Use Nest built-in logger and default exception handling where sufficient. Unexpected HTTP failures return a generic 500; unknown routes return 404. Never return raw database errors or deliberately log environment dumps, credentials, request bodies or authorization headers. Add a custom filter only if source review demonstrates a concrete gap.
- Migration tooling may own its history table. No permanent demonstration schema or fake business migration. Offline generation and runner source review suffice for this schema-free phase. Verify application and repeatability with the first real migration on a disposable database; match recovery checks to its risk.

## Acceptance examples

Acceptance scope simplified and closure approved by the user on 2026-10-12. This schema-free phase requires focused evidence of the development foundation, not production readiness. The phase tracker owns results and limits.

### AC-01 — Workspace and bootstrap

R-01: Typecheck succeeds; the API starts through Nest/Fastify. Watch mode compiles and restarts after successful changes. Source review confirms no standalone Fastify routing, business modules or frontend scaffold. Fresh-checkout installation with the pinned toolchain is deferred to build/release preparation.

### AC-02 — Configuration failures

R-02: Review required URL/port validation and secret-safe errors. Check TLS-switch default, explicit values and invalid-value rejection. Confirm safe examples and ignored local secrets. Verified certificate trust is required before production use; the explicit staging bypass does not prove it.

### AC-03 — Database and migrations

R-03: Establish database authentication and a read-only Drizzle query through the configured pool. Confirm offline SQL generation and explicit migration wiring without creating fixture tables. Migration application/repeatability and risk-appropriate recovery checks are deferred to the first real schema migration. Review shutdown hooks; runtime session-release confirmation is deferred to deployment validation.

### AC-04 — Health and errors

R-04: Observe the defined health 200/503 responses and unknown-route 404. Review deadline/resource handling and built-in error handling. Injected 500 routes and network fault exercises are not phase exit requirements; recovery under faults remains unverified.

### AC-05 — Repeatable handoff

R-05: Document setup, watch/start and explicit migration commands. Record observed evidence and deferred checks. User acceptance closes this development foundation only; no business or production readiness is implied.

## Proposed tooling and trade-offs

Core tooling agreed by the user on 2026-10-11: pnpm workspaces, Node/TypeScript with Nest/Fastify, and Drizzle ORM over `pg`, with Drizzle Kit generating committed SQL and an explicit ORM migration runner (user direction on 2026-10-11 supersedes node-pg-migrate). Exact pins are recorded in manifests/lockfile after official registry review. Focused typecheck and offline generation evidence lives in the phase tracker; development reachability is evidenced in the phase tracker; production validation remains deferred. No local provisioning or Docker Compose in this phase. Hosted PostgreSQL is the development direction; Supabase is the configured development provider.

| Choice | Recommendation | Material alternative / cost |
| --- | --- | --- |
| Workspace | pnpm native workspaces; one root lockfile, pinned packageManager | npm workspaces avoids an extra package manager. Nx/Turborepo provide no demonstrated benefit for one API. [pnpm workspace documentation](https://pnpm.io/workspaces) describes the native workspace file. |
| Runtime/framework | Node 24.21.0, Nest core/adapter 12.1.2, Nest config 12.0.1, TypeScript 6.0.3 and pnpm 12.11.2; manifests/lockfile own exact dependencies | Use the supported adapter dependency range, not an independently selected Fastify major. Nest companion packages have their own versions. [Node release status](https://nodejs.org/en/about/previous-releases) and [Nest migration guide](https://docs.nestjs.com/migration-guide) support the baseline; Use `tsc` and Node directly; Nest CLI is unnecessary for this increment. These facts do not prove this project's startup. |
| Persistence | Drizzle ORM 0.45.4 over the existing `pg` pool; Drizzle Kit 0.31.11 generates reviewed SQL | One migration history, no schema push or startup migrations. Generation is offline; application uses shared TLS configuration with verification enabled by default. Recover with forward corrective migrations; serialize migration runs operationally. [Drizzle generation](https://orm.drizzle.team/docs/drizzle-kit-generate). |
| Database | Supported PostgreSQL version actually offered by the selected host; record exact server major/minor with the first schema migration | Previous version 18 recommendation is superseded by hosted development. Do not require an unsupported provider upgrade. Check [PostgreSQL support policy](https://www.postgresql.org/support/versioning/); no server was inspected. |
| Provisioning | User supplies a dedicated hosted development PostgreSQL database; recommend Supabase as a candidate using PostgreSQL connections only | No provisioning automation, local database or Docker Compose. Other managed PostgreSQL hosts fit the same boundary; no provider SDK or hosted Auth is needed. Provider cost, region, limits and availability are not yet evaluated for a specific project. |

## Hosted development and portability

- Supabase is a suitable candidate for managed development PostgreSQL, not a commitment to its platform services. Keep all database access behind the Nest backend; no browser database credentials, Supabase SDK, Auth, Storage, Realtime, CLI or second migration system in this phase.
- For a persistent Nest process, prefer a direct connection. If the development network cannot reach the direct endpoint, use the provider's session pooler. Supabase documents direct connections for migrations and session mode for IPv4-only persistent clients. Do not use transaction pooling for this foundation's migration runner/session assumptions. See [connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres) and [pooling guidance](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits).
- Keep the application pool small (maximum 5); confirm the selected project's connection budget before business persistence. No retry framework or second pooler infrastructure.
- Use a dedicated development database/project and synthetic data. Supabase may expose schemas through its Data API: before business tables exist, explicitly decide schema exposure and database-role privileges; do not assume backend authorization protects a separate provider API. No tenant/schema design is introduced now.
- TLS verifies the certificate and hostname by default; the explicit staging exception above is accepted for development closeout. Production requires verification; install the provider CA locally if required. See [Supabase SSL guidance](https://supabase.com/docs/guides/platform/ssl-enforcement) and [pg TLS configuration](https://node-postgres.com/features/ssl).
- Use standard PostgreSQL SQL and owned migrations; avoid provider-specific schemas/extensions. Moving later requires a deliberate data export/import, compatible server versions, roles and user-run migration/recovery evidence. Changing a URL alone does not move data.
- Hosted development requires internet and does not establish the architecture's offline restaurant-LAN requirement. Production topology, business isolation and any synchronization remain unresolved.

## Open decisions and risks

Implementation authorized on 2026-10-11 for R-01–R-05. Exact direct dependency versions are recorded in package manifests based on registry metadata; focused typechecks, user-run startup and read-only hosted reachability are evidenced; production operation remains unverified.

Development reachability is established against configured Supabase. Before business persistence/deployment, record server version, connection mode, connection budget and certificate trust. Credentials remain in ignored local configuration. No provider provisioning, purchases or production actions are authorized.

Before Business/Branch and Authentication/Access: decide isolated installations/databases versus shared hosting and enforcement. Recommend evaluating isolated restaurant-local deployments first because the architecture requires LAN operation without internet; this is a proposal, not an approved topology or a synchronization design.

## Deferrals and completion shape

P1 for this foundation: OpenAPI UI, request tracing, custom JSON log stack, metrics, separate liveness/readiness probes, application build/test CI orchestration (the existing PR-title workflow is already implemented), API containerization and workspace task caching. None is needed to establish this small boundary; reconsider against later consumers or deployment requirements.

Later-phase product work (not downgraded to P1): Business/Branch, Authentication/Access, Menu and remaining business modules. Also excluded: frontend, payments, printing, synchronization, production deployment, purchases and Odoo changes.

After acceptance, subsequent modules can consume a Nest application composition point and injected database pool with an explicit migration workflow. No business API, identity or tenant enforcement will exist. This foundation must not be exposed as an operational POS.

## Drizzle workflow — approved 2026-10-11

The user authorizes replacing node-pg-migrate with Drizzle. `DatabaseService.db` exposes Drizzle on the existing pool. Module infrastructure owns future schema declarations; the shared schema entry point re-exports them for generation. No business tables are introduced. `db:generate` needs no credentials; `db:migrate` applies committed SQL explicitly with the shared TLS configuration. Empty migration sets make no database connection. There is no down command; use reviewed corrective migrations. Run only one migrator at a time. Any database previously migrated with node-pg-migrate requires an explicit history transition before applying Drizzle migrations.
