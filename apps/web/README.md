# Web application

This is the initial React, TypeScript and Vite application. It renders a minimal placeholder and does not yet connect to the API.

From the repository root, use the Node and pnpm versions specified in the root setup, then install workspace dependencies with `pnpm install --frozen-lockfile`. Run:

```sh
pnpm --filter @servicelane/web dev
pnpm --filter @servicelane/web typecheck
pnpm --filter @servicelane/web build
```

The development server serves the frontend only. API integration, authentication and deployment are separate work. See the [frontend architecture proposal](../../docs/architecture/frontend-proposal.md).
