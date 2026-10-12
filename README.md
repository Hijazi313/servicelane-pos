# ServiceLane POS

Backend foundation for a reusable restaurant POS. Development foundation accepted; BA-01 adds schema and operator bootstrap source, accepted on staging. No business HTTP workflows or login/sessions exist yet. See the [foundation tracker](docs/planning/project-foundation/phase-tracker.md).

## Requirements

- Node.js 24.21.0 (recorded in `.node-version`).
- pnpm 12.11.2 (recorded in `package.json`).
- A user-managed, dedicated hosted PostgreSQL development database. No local database or Docker setup is provided.

Direct package versions were selected from official registry metadata. Runtime compatibility still needs user-run acceptance. Install the pinned Node/pnpm versions using your normal tooling; this repository does not install global tools.

## Setup

From the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
cp .env.example .env
```

Edit the ignored `.env` locally. Use a PostgreSQL connection URL with percent-encoded credentials and **no query parameters**. TLS verifies the certificate and hostname by default; use `DATABASE_CA_FILE` when your provider requires its CA certificate. Relative certificate paths are resolved from repository root. For the user-approved staging exception, set `DATABASE_TLS_VERIFY=false` in staging environment configuration. TLS remains encrypted, but the server identity is not verified; this applies to API and migration connections. Keep verification enabled in production. The switch is explicit and is not inferred from `NODE_ENV`; staging can still use `NODE_ENV=production`. Environment variables already set in the shell take precedence over `.env`.

For Supabase, use a direct endpoint or a session-mode pooler when direct access is unavailable on your network. Use a direct/session connection for migrations, not a transaction pooler. `MIGRATION_DATABASE_URL` optionally supplies a separate endpoint/role; it defaults to `DATABASE_URL`. Both connections currently use the same optional CA file. A project requiring different CA roots can supply a PEM bundle. Select a dedicated development project and record its actual PostgreSQL version and connection budget. Supabase's other platform services are not dependencies.

The API requires a database URL even if the database is currently unreachable. It creates its pool lazily; startup does not create databases or apply migrations.

## Development watch mode

From repository root, run `pnpm dev`. TypeScript compiles once and watches source changes; after each successful compilation, the API process restarts. Compilation errors prevent a new start. Ctrl-C stops the watcher and API. This uses the same ignored `.env` as `pnpm start`; restart the command after changing environment configuration. Migrations remain explicit and are never run by watch mode.

## User-run commands

Build before starting the API or applying migrations:

```sh
pnpm build
pnpm db:migrate
pnpm start
```

`db:migrate` is an explicit database write: confirm the target first. BA-01 includes the first generated business migration; running `db:migrate` performs database writes; it was verified on authorized staging, and other targets/runs must remain within explicit authorization. When an authorized module adds schema, run `pnpm db:generate` offline, review and commit the generated SQL and metadata, then build and run `pnpm db:migrate`. See [migration conventions](apps/api/migrations/README.md). Recover with reviewed forward corrective migrations; no rollback command is provided.

Default HTTP binding is `127.0.0.1:3000`. `HOST`, `PORT` and `NODE_ENV` are validated before listening. Invalid configuration exits nonzero with field names rather than secret values. Built-in Nest logging/error handling is used; request-body logging is not enabled.

```sh
curl -i http://127.0.0.1:3000/health
```

`GET /health` returns 200 `{"status":"ok"}` when a read-only database query succeeds, or 503 `{"status":"unavailable"}` on failure. Its database operation has a three-second deadline covering pool acquisition and query execution. This is reachability, not migration currency or POS readiness. An unavailable database does not stop HTTP startup. Ctrl-C/SIGTERM closes the server and pool.

See the [acceptance record](docs/acceptance/project-foundation.md) for verified development behavior and deferred migration, TLS and operational checks. Hosted development requires internet and does not establish offline restaurant-LAN operation.

## Structure and next boundary

- `apps/api/src/app.module.ts`: Nest composition point.
- `apps/api/src/infrastructure/`: configuration, injected `DatabaseService` and technical health route.
- `apps/api/migrations/`: reviewed offline SQL migrations; application remains separately authorized.
- `docs/`: scope, architecture, specifications and acceptance evidence.

Future authorized modules may import `DatabaseModule` and inject `DatabaseService`; its `db` exposes Drizzle over the same PostgreSQL pool and is technical infrastructure, not a cross-module repository. Each business module will own its persistence and public interfaces. The approved initial topology is one business per LAN installation with its own database and local client assets; deployment is not implemented.

Business and administrator bootstrap were verified on staging; synthetic records were removed, leaving the migrated tables empty. No frontend, HTTP authentication/sessions, provider SDK, generic repositories or synchronization is included. See the [operator instructions](apps/api/src/operator/README.md), [Business capability index](apps/api/src/modules/business/docs/README.md), [Authentication capability index](apps/api/src/modules/authentication/docs/README.md) and [BA-01 evidence](docs/planning/business-access/phase-tracker.md). See [contribution rules](CONTRIBUTING.md).
