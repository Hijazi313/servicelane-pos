# Web capability index

| Capability | Entry point | Status and constraints |
| --- | --- | --- |
| Staff access client | [Application](../src/app/app.tsx), [access operations](../src/features/access/access-api.ts), [screens](../src/features/access/access-screens.tsx), [routes](../src/app/router.tsx) | Login, required password change, server-checked home placeholder and logout source implemented with explicit paths. The user reports local HTTPS login, logout, re-login and hard refresh. Full route/session behavior and production hosting remain unverified; see [tracker](../../../docs/planning/frontend-access/phase-tracker.md). |

| Menu setup | [Menu page](../src/features/menu/menu-page.tsx), [drawer](../src/features/menu/menu-form.tsx) | Initial administrator workflow accepted under the user-reported local walkthrough; broader UI and recovery verification is deferred. Performance remains open; photo upload is disabled. [Plan and evidence](../../../docs/planning/frontend/initial-menu-setup.md). |

| Cashier order capture | [Cashier screen](../src/features/cashier/cashier-screen.tsx) | Source implements active-menu selection, takeaway capture and paginated saved-order readback. Browser walkthrough, independent UI readiness and user acceptance remain pending; listing PostgreSQL and large-history performance are unverified. [Scope and evidence](../../../docs/planning/frontend/cashier-order-capture.md). |

| Shared HTTP client | [Client](../src/shared/api/http-client.ts) | Same-origin JSON requests and fresh CSRF proof for writes; HTTP failures expose status. Feature operations validate responses and decide recovery. Requests are not automatically retried. |

| Server data | [Query client](../src/app/query-client.ts), [Menu workflow](../src/features/menu/use-menu.ts) | Menu reads and saves use TanStack Query. Queries and mutations do not retry automatically or depend on browser online status; session transitions clear the cache. Menu refreshes after save and does not treat a failed readback as a failed write. Browser recovery verification remains pending. |
