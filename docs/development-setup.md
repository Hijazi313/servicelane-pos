# Development configuration

This guide covers database connectivity and HTTPS configuration for the current hosted development workflow. See the [root README](../README.md#development-setup) for prerequisites, build commands, and starting the API.

## Environment and database connection

From the repository root, after installing the pinned Node.js and pnpm versions:

```sh
pnpm install --frozen-lockfile --ignore-scripts
if [ ! -e .env ] && [ ! -L .env ]; then cp .env.example .env; fi
```

Edit the ignored `.env` locally. Use a PostgreSQL connection URL with percent-encoded credentials and **no query parameters**. TLS verifies the certificate and hostname by default; use `DATABASE_CA_FILE` when your provider requires its CA certificate. Relative certificate paths are resolved from repository root. For the user-approved staging exception, set `DATABASE_TLS_VERIFY=false` in staging environment configuration. TLS remains encrypted, but the server identity is not verified; this applies to API and migration connections. Keep verification enabled in production. The switch is explicit and is not inferred from `NODE_ENV`; staging can still use `NODE_ENV=production`. Environment variables already set in the shell take precedence over `.env`.

For Supabase, use a direct endpoint or a session-mode pooler when direct access is unavailable on your network. Use a direct/session connection for migrations, not a transaction pooler. `MIGRATION_DATABASE_URL` optionally supplies a separate endpoint/role; it defaults to `DATABASE_URL`. Both connections currently use the same optional CA file. A project requiring different CA roots can supply a PEM bundle. Select a dedicated development project and record its actual PostgreSQL version and connection budget. Supabase's other platform services are not dependencies.

The API requires a database URL and canonical HTTPS `CLIENT_ORIGIN` even if the database is currently unreachable. It creates its pool lazily; startup does not create databases or apply migrations. Session cleanup runs after 60 seconds when the application is started and can modify the database. Use an authorized development target.

## HTTPS and reverse proxies

Business API routes use `/api/v1`; `/health` retains its technical contract. Set `CLIENT_ORIGIN` to the intended canonical HTTPS origin, without a trailing slash. `TRUSTED_PROXY_ADDRESSES` optionally lists exact reverse-proxy IPs; the default trusts no forwarded headers.

Authenticated routes enforce HTTPS protocol, origin and Host, and emit Secure cookies. The plain HTTP upstream must remain on loopback behind the HTTPS reverse proxy. There is no login-over-plain-LAN-HTTP mode. Production certificates, reverse proxy and asset hosting require separate deployment work.

### Local browser development

The Vite development server supports a loopback-only HTTPS proxy for `/api` when supplied a trusted certificate and key. Without both, `/api` returns 503 instead of the frontend HTML; unauthenticated HTTP preview is not a working login setup. The proxy is for local development only, not a deployment configuration.

One option is [mkcert](https://github.com/FiloSottile/mkcert). Install it using your normal package manager, then run `mkcert -install` yourself if you choose to trust its local CA. This changes your machine's certificate trust store. Protect its CA private key and never share it. Generate a certificate for the loopback IP outside the repository:

```sh
mkdir -p "$HOME/.servicelane-dev"
chmod 700 "$HOME/.servicelane-dev"
mkcert -install
mkcert -cert-file "$HOME/.servicelane-dev/localhost.pem" -key-file "$HOME/.servicelane-dev/localhost-key.pem" 127.0.0.1
chmod 600 "$HOME/.servicelane-dev/localhost-key.pem"
```

In the terminal that starts both servers, configure the exact same browser origin on the API and the proxy. These values are process-local overrides; they do not modify `.env`:

```sh
export WEB_DEV_HTTPS_CERT="$HOME/.servicelane-dev/localhost.pem"
export WEB_DEV_HTTPS_KEY="$HOME/.servicelane-dev/localhost-key.pem"
export WEB_DEV_PORT=5173
export WEB_DEV_API_PORT=3000
export HOST=127.0.0.1
export PORT=3000
export CLIENT_ORIGIN=https://127.0.0.1:5173
export TRUSTED_PROXY_ADDRESSES=127.0.0.1
pnpm dev
```

Open `https://127.0.0.1:5173` after both servers start. Vite uses a strict port in this mode; if 5173 is occupied, stop the conflicting process or choose another port and update both `WEB_DEV_PORT` and `CLIENT_ORIGIN`. If the API uses a different port, update both `PORT` and `WEB_DEV_API_PORT`. The browser origin, API `CLIENT_ORIGIN` and certificate IP must match exactly. The proxy forwards the browser Host and Origin and supplies the trusted HTTPS protocol header; it removes caller-supplied forwarded headers. Do not expose the plain API listener or this development proxy to the LAN, bypass browser certificate warnings, or commit certificate keys. API startup can perform background database cleanup, so use only an authorized development target.

Proxy behavior has a focused synthetic test: from `apps/web`, run `node --test tests/dev-proxy.test.mjs` with the project Node version and OpenSSL installed. It uses loopback, a temporary certificate and a mock upstream; it does not prove trusted browser cookies or a live login.

See the [authentication specification](../apps/api/src/modules/authentication/docs/features/access/spec.md) for contracts and the [operator guide](../apps/api/src/operator/README.md) for provisioning and recovery.

## Runtime behavior

`HOST`, `PORT` and `NODE_ENV` are validated before listening. Invalid configuration exits nonzero with field names rather than secret values. Built-in Nest logging/error handling is used; request-body logging is not enabled.

`pnpm dev` starts the API watcher and Vite together. The API compiles once and watches source changes; each successful compilation restarts it, while compilation errors prevent a new start. It uses the same ignored `.env` as `pnpm start`. Restart the command after environment changes. Migrations are never applied by watch mode. Run `pnpm --filter @servicelane/api dev` or `pnpm --filter @servicelane/web dev` to start only one server. Starting both does not configure the same-origin HTTPS proxy required for authenticated browser requests.

The API can start while the database is unavailable. The health query has a three-second deadline covering pool acquisition and query execution. Ctrl-C/SIGTERM closes the server and database pool.

Hosted development requires internet access and does not establish offline restaurant-LAN operation. See the [foundation acceptance record](acceptance/project-foundation.md) and [current tracker](planning/TRACKER.md) for evidence and remaining operational verification.
