# Web application

This React, TypeScript and Vite application contains a first access client for login, required password change, a protected placeholder and logout. Browser-to-API integration remains unverified and requires the same-origin HTTPS setup described below.

See the [web capability index](docs/capabilities.md) for implemented source and evidence limits.

Ant Design is installed and its `ConfigProvider` uses the application-owned defaults in `src/app/theme.ts`. The primary color is currently configured in code through a small theme input; a future business configuration must be validated before it is used. Restaurant-specific configuration and any administrator UI are not implemented. Validate the theme on a representative cashier workflow before treating the visual direction as accepted.

From the repository root, use the Node and pnpm versions specified in the root setup, then install workspace dependencies with `pnpm install --frozen-lockfile`. Run:

```sh
pnpm --filter @servicelane/web dev
pnpm --filter @servicelane/web typecheck
pnpm --filter @servicelane/web build
node --experimental-transform-types --test apps/web/tests/access-api.test.mjs
```

To start both the API watcher and frontend from the repository root, run `pnpm dev`. The Vite development server serves the frontend only; starting both processes does not configure API integration or the HTTPS proxy required for authentication. Deployment remains separate work. See the [frontend architecture proposal](../../docs/architecture/frontend-proposal.md).
