# Web application

This React, TypeScript and Vite application contains a first access client for login, required password change, a protected placeholder and logout. The user reports successful login, logout, re-login and hard refresh on local same-origin HTTPS. The [access tracker](../../docs/planning/frontend-access/phase-tracker.md) records the remaining verification and acceptance decision.

TanStack Router defines `/login`, `/change-password` and `/`. The server session controls which access screen is shown; route guards do not authorize API calls. Browser navigation and host fallback for direct route refresh remain unverified.

See the [web capability index](docs/capabilities.md) for implemented source and evidence limits.

Ant Design is installed and its `ConfigProvider` uses the application-owned defaults in `src/app/theme.ts`. The primary color is currently configured in code through a small theme input; a future business configuration must be validated before it is used. Restaurant-specific configuration and any administrator UI are not implemented. Validate the theme on a representative cashier workflow before treating the visual direction as accepted.

From the repository root, use the Node and pnpm versions specified in the root setup, then install workspace dependencies with `pnpm install --frozen-lockfile`. Run:

```sh
pnpm --filter @servicelane/web dev
pnpm --filter @servicelane/web typecheck
pnpm --filter @servicelane/web build
node --experimental-transform-types --test apps/web/tests/access-api.test.mjs
```

To start both the API watcher and frontend from the repository root, run `pnpm dev`. The frontend defaults to HTTPS on `127.0.0.1:5174`; first configure the certificate and matching API settings as described in the [local HTTPS development guide](../../docs/development-setup.md#local-browser-development). API startup can modify the database through background cleanup. Deployment remains separate work. See the [frontend architecture proposal](../../docs/architecture/frontend-proposal.md).
