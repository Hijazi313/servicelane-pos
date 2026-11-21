# ServiceLane POS

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-087EA4?style=for-the-badge&logo=react&logoColor=white) ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

ServiceLane POS is a restaurant point-of-sale system designed for independent restaurant businesses using one maintained codebase.

The product is intended to support restaurant operations from menu configuration through ordering, kitchen fulfilment, billing, and reporting. The planned deployment model is one installation per restaurant business, running on its local network with a dedicated PostgreSQL database and locally served client assets.

Restaurant identity, branding, currency, timezone, and fiscal settings belong to business configuration.

## Why this project?

ServiceLane POS aims to bring everyday restaurant workflows into one system designed to run on the restaurant's local network. The goal is to support independent businesses through configurable menus and business settings, while keeping improvements shared across one maintained codebase.

## Project status

**Active development · Not production-ready**

### Frontend

The React application has an accepted foundation and three workflows at different stages:

| Workflow | Current status |
| --- | --- |
| Staff access | Login, required password change and logout are implemented. Local login, logout, re-login and hard refresh are user-reported; remaining checks and acceptance are open. [Access tracker](docs/planning/frontend-access/phase-tracker.md) |
| Menu setup | The initial administrator workflow is accepted under the recorded local walkthrough. Broader UI and recovery verification are deferred, and [performance remains open](KNOWN-ISSUES.md#ki-01--slow-authenticated-workflows-on-the-development-database). [Menu scope and evidence](docs/planning/frontend/initial-menu-setup.md) |
| Cashier order capture | Active-menu selection, takeaway capture and saved-order browsing are implemented in source on the current work branch. The walkthrough, independent UI readiness and acceptance remain pending; pagination and large-history performance are unverified. [Cashier scope and evidence](docs/planning/frontend/cashier-order-capture.md) |

### Backend

The following scopes have been accepted for backend development; operational release validation remains separate:

| Area | Backend scope |
| --- | --- |
| Business setup | Business and branch foundation, installation provisioning, and initial administrator setup |
| Authentication and access | Staff login, sessions, server-enforced permissions, and administrator recovery |
| Menu catalogue | Catalogue maintenance, selectable sizes, optional extras, configurable combos, and selection pricing |
| Order capture | Scoped takeaway capture/readback, immutable merchandise snapshots, configurable limits and duplicate-safe retries |
| Kitchen | Dispatch, preparation queue/readback and preparation states |
| Billing and payments | Settlement backend; routes mounted in application source |
| Cashier shifts | Drawer sessions, cash movements, handover and closing controls; routes mounted in application source |

These scopes include focused offline and bounded PostgreSQL evidence, with limits recorded in their respective trackers. Cashier Shifts was integrated into main through [PR #21](https://github.com/Hijazi313/servicelane-pos/pull/21).

[Inventory](docs/planning/inventory/discovery.md) remains in discovery. Deployment, backup, recovery, an end-to-end trading flow and operational release validation remain incomplete.

See the [project tracker](docs/planning/TRACKER.md) for the roadmap, current acceptance status, and verification limits.

## Technology stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Frontend | React, Vite, TanStack Router and Query, Ant Design |
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

The current development workflow uses hosted PostgreSQL. Local database provisioning and Docker configuration are not included. If you use nvm, `npm run setup:toolchain` installs the Node version from `.node-version` and enables the pnpm Corepack shim. Run `nvm use` in your current terminal; `.nvmrc` points to the same version file. An npm script cannot change its parent shell. You can also install the pinned tools using your normal tooling.

To select the project version automatically when entering this directory in zsh, add this after nvm is loaded in `~/.zshrc`:

```sh
autoload -U add-zsh-hook
servicelane_nvm_use() {
  local nvmrc
  nvmrc="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc" ] && [ "$(nvm version)" != "$(nvm version "$(cat "$nvmrc")")" ]; then
    nvm use --silent
  fi
}
add-zsh-hook chpwd servicelane_nvm_use
servicelane_nvm_use
```

The hook also respects `.nvmrc` files in other directories. It does not install missing Node versions; run `nvm install` in the project if needed. Restart the terminal or source `~/.zshrc` after adding it.

### Installation and configuration

From the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
if [ ! -e .env ] && [ ! -L .env ]; then cp .env.example .env; fi
```

Configure `.env` using [`.env.example`](.env.example). Provide `DATABASE_URL`, `CLIENT_ORIGIN` (the canonical HTTPS client origin without a trailing slash), and the stable secret `ORDER_CURSOR_SIGNING_KEY` described in [development setup](docs/development-setup.md). Keep credentials out of version control.

Read the [development configuration guide](docs/development-setup.md) for connection URL requirements, provider endpoints, TLS certificates, and reverse-proxy settings before connecting. Database TLS verifies certificates and hostnames by default.

### Database setup

Build the application, then apply the reviewed migrations:

```sh
pnpm build
pnpm db:migrate
```

**Migrations modify the configured database.** Confirm the intended, authorized development target before running them. Application startup does not apply migrations.

See [migration conventions](apps/api/migrations/README.md) for generation, review, and corrective changes.

### Run the development servers

For browser access, first configure the certificate, matching origin and local proxy described in the [local HTTPS development guide](docs/development-setup.md#local-browser-development). Then start the API watcher and React development server together:

```sh
pnpm dev
```

For only one server, run `pnpm --filter @servicelane/api dev` or `pnpm --filter @servicelane/web dev`. Vite serves the client and proxies API requests over the configured local HTTPS origin; this development setup is not a deployment configuration.

With the default local configuration:

| Service | Address |
| --- | --- |
| Web client and API proxy | `https://127.0.0.1:5174` |
| API listener | `http://127.0.0.1:3000` |

The browser origin, certificate and API configuration must match; see the local HTTPS guide above when changing ports.

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
| `pnpm dev` | Run the API watcher and React development server together |
| `pnpm --filter @servicelane/api dev` | Watch and restart only the API |
| `pnpm --filter @servicelane/web dev` | Run only the React development server |
| `pnpm build` | Compile the API |
| `pnpm --filter @servicelane/web typecheck` | Typecheck the frontend |
| `pnpm --filter @servicelane/web build` | Typecheck and build the frontend |
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
- [Orders](apps/api/src/modules/orders/docs/README.md)
- [Kitchen](apps/api/src/modules/kitchen/docs/README.md)
- [Billing](apps/api/src/modules/billing/docs/README.md) and [Cashier Shifts](apps/api/src/modules/cashier-shifts/docs/README.md) (routes mounted in application source)

## Repository structure

```text
apps/
├── api/
│   ├── src/modules/      # Business modules and their documentation
│   ├── src/operator/     # Provisioning and recovery commands
│   └── migrations/       # Database migrations
└── web/
    ├── src/app/          # Application setup and routing
    ├── src/features/     # Access, Menu and Cashier workflows
    ├── src/shared/       # Shared frontend code
    └── docs/             # Frontend capability index
packages/
└── api-contracts/        # Shared API contracts
docs/                     # Scope, architecture, planning and acceptance
scripts/                  # Repository-level tooling
.github/                  # CI workflows and pull request template
```

API modules own their business rules, persistence, and public interfaces. Shared infrastructure provides technical capabilities such as configuration and database connectivity. See the [web application guide](apps/web/README.md) for frontend development and its [capability index](apps/web/docs/capabilities.md) for implemented work.

See the [architecture guide](docs/architecture/README.md) for dependency rules and module boundaries.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes.

The [project scope](docs/project-scope.md) defines delivery boundaries, and the [project tracker](docs/planning/TRACKER.md) identifies active work. Feature specifications and acceptance criteria live alongside their owning modules.

## Further documentation

- [Development configuration](docs/development-setup.md)
- [Project scope and working policy](docs/project-scope.md)
- [Roadmap and delivery status](docs/planning/TRACKER.md), including the [frontend overview](docs/planning/frontend/TRACKER.md)
- [Architecture](docs/architecture/README.md)
- [Operational procedures](apps/api/src/operator/README.md)
- [Compliance guidance](docs/compliance/README.md)

## Author

👨‍💻 **Muhammad Hamza** · Software engineer

🔗 [LinkedIn](https://www.linkedin.com/in/hijazi313/) · ✉️ [Email](mailto:imhamzaa313@gmail.com)

---

Made with ❤️ for independent restaurants.
