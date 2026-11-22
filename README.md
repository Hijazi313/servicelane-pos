# ServiceLane POS

ServiceLane POS is a restaurant POS for independent restaurants, designed for local networks with one NestJS and React codebase; backend modules are in place, while the full trading flow and production readiness are still in progress.

## Why this exists

Restaurants should have local control over their operations without a separate software fork for each business. ServiceLane is designed around shared code and configurable business settings, including identity, currency and timezone.

## Current status

**Active development · Not production-ready**

- ✅ **Backend development accepted:** business setup, staff access, menu, order capture, kitchen, billing and cashier shifts have accepted backend scopes. Operational release validation remains separate.
- ✅ **Frontend foundation and initial menu setup accepted:** menu acceptance covers the recorded local walkthrough; broader UI and recovery verification remain open.
- 🔄 **Staff access and cashier screens:** implemented workflows are under further review; cashier acceptance and independent UI readiness remain pending.
- ⏳ **Full trading flow and release:** amendments, reconnect, receipt output, deployment, backup and recovery remain incomplete or unaccepted. Inventory is in discovery.

See the [project tracker](docs/planning/TRACKER.md) for current work and evidence limits, the [frontend overview](docs/planning/frontend/TRACKER.md) for client status, and [known issues](KNOWN-ISSUES.md) for outstanding problems.

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

This path starts the API and web app and creates an initial administrator for a **new, empty development database**. Allow extra time for installing tools, creating a hosted database and trusting a local certificate; the complete setup has not been timed.

### Before you start

- Install Node.js **24.21.0** ([`.node-version`](.node-version)) and pnpm **12.11.2** ([`package.json`](package.json)). With nvm installed, run `npm run setup:toolchain`, then `nvm use` in your current terminal. You can use your own tool manager instead.
- Have a dedicated, empty hosted PostgreSQL database you are authorized to modify, with internet access and a direct or session-mode connection URL. Local database provisioning and Docker configuration are not included. See [database connection requirements](docs/development-setup.md#environment-and-database-connection), including TLS and provider CA certificates.
- Install [mkcert](https://github.com/FiloSottile/mkcert) and OpenSSL. The certificate step below asks mkcert to add a local CA to your machine's trust store.

### 1. Install and configure

Clone the repository, enter its root directory, and run:

```sh
pnpm install --frozen-lockfile --ignore-scripts
if [ ! -e .env ] && [ ! -L .env ]; then cp .env.example .env; fi
openssl rand -hex 32
```

Edit `.env` and set:

- `DATABASE_URL` to your development database URL, with percent-encoded credentials and no query parameters. Set `DATABASE_CA_FILE` if your provider requires a CA certificate.
- `CLIENT_ORIGIN=https://127.0.0.1:5174` and `TRUSTED_PROXY_ADDRESSES=127.0.0.1` (uncomment the latter).
- `ORDER_CURSOR_SIGNING_KEY` to the 64-character output of `openssl rand -hex 32`. Keep it private and stable across restarts.

Keep `.env` and credentials out of version control. Shell environment variables override `.env`; see the [configuration guide](docs/development-setup.md) for details.

### 2. Prepare the database and administrator

**These commands write to the configured database.** Check the target before running them; do not use a database containing real business data.

```sh
pnpm build
pnpm db:migrate
cp apps/api/src/operator/provision-installation.example.json "$HOME/servicelane-installation.json"
```

Edit the copied JSON with your development business, branch and administrator details. Then run the command below in an interactive terminal and enter a 15–128-character password at its hidden prompts:

```sh
pnpm provision-installation "$HOME/servicelane-installation.json"
```

Provisioning is for an uninitialized installation and does not overwrite an existing one. See the [operator guide](apps/api/src/operator/README.md) for requirements and troubleshooting. Migrations are not applied automatically when the app starts.

### 3. Trust a local certificate and start

```sh
mkdir -p "$HOME/.servicelane-dev"
chmod 700 "$HOME/.servicelane-dev"
mkcert -install
mkcert -cert-file "$HOME/.servicelane-dev/localhost.pem" -key-file "$HOME/.servicelane-dev/localhost-key.pem" 127.0.0.1
chmod 600 "$HOME/.servicelane-dev/localhost-key.pem"
pnpm dev
```

Open [https://127.0.0.1:5174](https://127.0.0.1:5174) and sign in with the administrator username and password you created. Follow the password-change prompt. The API listens at `http://127.0.0.1:3000`; Vite proxies browser requests over HTTPS because authenticated routes require Secure cookies. Stop both servers with Ctrl-C. API startup also runs background database cleanup, so use an authorized development target.

If the browser cannot connect or login fails, check that the certificate, browser address and `CLIENT_ORIGIN` match, the proxy address is trusted, and ports 5174 and 3000 are free. See [local HTTPS development](docs/development-setup.md#local-browser-development) for alternative ports and certificate paths. Check database reachability separately:

```sh
curl -i http://127.0.0.1:3000/health
```

HTTP `200` with `{"status":"ok"}` confirms database connectivity; `503` means it is unavailable. This does not check migration currency or full application readiness. See [migration conventions](apps/api/migrations/README.md) for migration review and changes.

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
