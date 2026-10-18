# Development configuration

This guide covers database connectivity and HTTPS configuration for the current hosted development workflow. See the [root README](../README.md#development-setup) for prerequisites, build commands, and starting the API.

## Environment and database connection

From the repository root, after installing the pinned Node.js and pnpm versions:

```sh
pnpm install --frozen-lockfile --ignore-scripts
cp .env.example .env
```

Edit the ignored `.env` locally. Use a PostgreSQL connection URL with percent-encoded credentials and **no query parameters**. TLS verifies the certificate and hostname by default; use `DATABASE_CA_FILE` when your provider requires its CA certificate. Relative certificate paths are resolved from repository root. For the user-approved staging exception, set `DATABASE_TLS_VERIFY=false` in staging environment configuration. TLS remains encrypted, but the server identity is not verified; this applies to API and migration connections. Keep verification enabled in production. The switch is explicit and is not inferred from `NODE_ENV`; staging can still use `NODE_ENV=production`. Environment variables already set in the shell take precedence over `.env`.

For Supabase, use a direct endpoint or a session-mode pooler when direct access is unavailable on your network. Use a direct/session connection for migrations, not a transaction pooler. `MIGRATION_DATABASE_URL` optionally supplies a separate endpoint/role; it defaults to `DATABASE_URL`. Both connections currently use the same optional CA file. A project requiring different CA roots can supply a PEM bundle. Select a dedicated development project and record its actual PostgreSQL version and connection budget. Supabase's other platform services are not dependencies.

The API requires a database URL and canonical HTTPS `CLIENT_ORIGIN` even if the database is currently unreachable. It creates its pool lazily; startup does not create databases or apply migrations. Session cleanup runs after 60 seconds when the application is started and can modify the database. Use an authorized development target.

## HTTPS and reverse proxies

Business API routes use `/api/v1`; `/health` retains its technical contract. Set `CLIENT_ORIGIN` to the intended canonical HTTPS origin, without a trailing slash. `TRUSTED_PROXY_ADDRESSES` optionally lists exact reverse-proxy IPs; the default trusts no forwarded headers.

Authenticated routes enforce HTTPS protocol, origin and Host, and emit Secure cookies. The plain HTTP upstream must remain on loopback behind the HTTPS reverse proxy. This repository does not provision certificates, reverse proxies or client assets; there is no login-over-plain-LAN-HTTP mode.

See the [authentication specification](../apps/api/src/modules/authentication/docs/features/access/spec.md) for contracts and the [operator guide](../apps/api/src/operator/README.md) for provisioning and recovery.

## Runtime behavior

`HOST`, `PORT` and `NODE_ENV` are validated before listening. Invalid configuration exits nonzero with field names rather than secret values. Built-in Nest logging/error handling is used; request-body logging is not enabled.

`pnpm dev` compiles once and watches source changes. Each successful compilation restarts the API; compilation errors prevent a new start. It uses the same ignored `.env` as `pnpm start`. Restart the command after environment changes. Migrations are never applied by watch mode.

The API can start while the database is unavailable. The health query has a three-second deadline covering pool acquisition and query execution. Ctrl-C/SIGTERM closes the server and database pool.

Hosted development requires internet access and does not establish offline restaurant-LAN operation. See the [foundation acceptance record](acceptance/project-foundation.md) and [current tracker](planning/TRACKER.md) for evidence and remaining operational verification.
