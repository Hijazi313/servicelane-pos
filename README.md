# ServiceLane POS

ServiceLane POS is a restaurant point-of-sale system designed for independent restaurant businesses using one maintained codebase.

The product is intended to support restaurant operations from menu configuration through ordering, kitchen fulfilment, billing, and reporting. The planned deployment model is one installation per restaurant business, running on its local network with a dedicated PostgreSQL database and locally served client assets.

Restaurant identity, branding, currency, timezone, and fiscal settings belong to business configuration.

## Why this project?

ServiceLane POS aims to bring everyday restaurant workflows into one system designed to run on the restaurant's local network. The goal is to support independent businesses through configurable menus and business settings, while keeping improvements shared across one maintained codebase.

## Project status

**Active development · Backend API only · Not production-ready**

The backend currently includes:

| Area | Available functionality |
| --- | --- |
| Business setup | Business and branch foundation, installation provisioning, and initial administrator setup |
| Authentication and access | Staff login, sessions, server-enforced permissions, and administrator recovery |
| Menu catalogue | Catalogue maintenance, selectable sizes, optional extras, configurable combos, and selection pricing |
| Order capture | Scoped takeaway capture/readback, immutable merchandise snapshots, configurable limits and duplicate-safe retries |

Business setup, authentication/access, and menu catalogue are accepted under their recorded backend development scopes. Menu was integrated through [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9); Orders capture/readback is implemented with focused offline and bounded staging persistence verification; its [acceptance status and limits](apps/api/src/modules/orders/docs/features/capture/phase-tracker.md) remain separate.

The frontend, further order workflows, kitchen, billing, payments, shifts, inventory, and reporting remain planned. Deployment, backup, and recovery validation remain incomplete.

See the [project tracker](docs/planning/TRACKER.md) for the roadmap, current acceptance status, and verification limits.

## Technology stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| API framework | NestJS |
| Database | PostgreSQL |
| Database tooling | Drizzle |
| Runtime | Node.js |
| Package manager | pnpm |

## Development setup

### Prerequisites

- Node.js **24.21.0**, as specified in [`.node-version`](.node-version).
- pnpm **12.11.2**, as specified in [`package.json`](package.json).
- A dedicated, user-managed hosted PostgreSQL development database.

The current development workflow uses hosted PostgreSQL. Local database provisioning and Docker configuration are not included. Install the pinned runtime and package manager using your normal tooling.

### Installation and configuration

From the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
cp .env.example .env
```

Configure `.env` using [`.env.example`](.env.example). Provide `DATABASE_URL` and `CLIENT_ORIGIN`, the canonical HTTPS client origin without a trailing slash. Keep credentials out of version control.

Read the [development configuration guide](docs/development-setup.md) for connection URL requirements, provider endpoints, TLS certificates, and reverse-proxy settings before connecting. Database TLS verifies certificates and hostnames by default.

### Database setup

Build the application, then apply the reviewed migrations:

```sh
pnpm build
pnpm db:migrate
```

**Migrations modify the configured database.** Confirm the intended, authorized development target before running them. Application startup does not apply migrations.

See [migration conventions](apps/api/migrations/README.md) for generation, review, and corrective changes.

### Run the API

For development with compilation and automatic restart:

```sh
pnpm dev
```

To run the compiled application after building:

```sh
pnpm start
```

The default address is `http://127.0.0.1:3000`. Restart the process after changing environment configuration. Starting the API activates background database cleanup, so use an authorized development target.

### Verify connectivity

```sh
curl -i http://127.0.0.1:3000/health
```

A successful database connectivity check returns HTTP `200`:

```json
{"status":"ok"}
```

The endpoint returns HTTP `503` with `{"status":"unavailable"}` when the database is unavailable. It checks reachability, not migration currency or complete application readiness.

## Development commands

Run commands from the repository root.

| Command | Description |
| --- | --- |
| `pnpm dev` | Watch source files and restart the API after successful compilation |
| `pnpm build` | Compile the API |
| `pnpm start` | Run the compiled API |
| `pnpm test:access` | Run focused database-free authentication and access checks |
| `pnpm test:menu` | Run focused database-free menu checks |
| `pnpm test:architecture` | Test the HTTP boundary checker with passing/failing fixtures |
| `pnpm check:architecture` | Scan domain/application HTTP boundaries; exits nonzero on violations |
| `pnpm db:generate` | Generate migration files for review |
| `pnpm db:migrate` | Apply migrations to the configured database |

Provisioning and administrator recovery commands are documented in the [operator guide](apps/api/src/operator/README.md).

## API overview

Business endpoints use the `/api/v1` prefix. The technical health endpoint is available at `/health`.

Authenticated routes require HTTPS and use Secure cookies. The local HTTP listener is intended to sit behind a correctly configured HTTPS reverse proxy; see [HTTPS configuration](docs/development-setup.md#https-and-reverse-proxies).

API contracts are maintained with their owning modules:

- [Business and branch setup](apps/api/src/modules/business/docs/README.md)
- [Authentication and access](apps/api/src/modules/authentication/docs/README.md)
- [Menu catalogue](apps/api/src/modules/menu/docs/README.md)

## Repository structure

```text
apps/api/
├── src/
│   ├── infrastructure/   # Configuration, database connectivity, and health
│   ├── modules/          # Business modules and their documentation
│   └── operator/         # Provisioning and recovery commands
└── migrations/           # Database migrations

docs/                     # Scope, architecture, planning, and acceptance
```

Modules own their business rules, persistence, and public interfaces. Shared infrastructure provides technical capabilities such as configuration and database connectivity.

See the [architecture guide](docs/architecture/README.md) for dependency rules and module boundaries.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes.

The [project scope](docs/project-scope.md) defines delivery boundaries, and the [project tracker](docs/planning/TRACKER.md) identifies active work. Feature specifications and acceptance criteria live alongside their owning modules.

## Further documentation

- [Development configuration](docs/development-setup.md)
- [Project scope and working policy](docs/project-scope.md)
- [Roadmap and delivery status](docs/planning/TRACKER.md)
- [Architecture](docs/architecture/README.md)
- [Operational procedures](apps/api/src/operator/README.md)
- [Compliance guidance](docs/compliance/README.md)
