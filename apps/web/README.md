# Web application

This is the initial React, TypeScript and Vite application. It renders a minimal placeholder and does not yet connect to the API.

Ant Design is installed and its `ConfigProvider` uses the application-owned defaults in `src/app/theme.ts`. The primary color is currently configured in code through a small theme input; a future business configuration must be validated before it is used. Restaurant-specific configuration and any administrator UI are not implemented. Validate the theme on a representative cashier workflow before treating the visual direction as accepted.

From the repository root, use the Node and pnpm versions specified in the root setup, then install workspace dependencies with `pnpm install --frozen-lockfile`. Run:

```sh
pnpm --filter @servicelane/web dev
pnpm --filter @servicelane/web typecheck
pnpm --filter @servicelane/web build
```

To start both the API watcher and frontend from the repository root, run `pnpm dev`. The Vite development server serves the frontend only; starting both processes does not configure API integration or the HTTPS proxy required for authentication. Deployment remains separate work. See the [frontend architecture proposal](../../docs/architecture/frontend-proposal.md).
