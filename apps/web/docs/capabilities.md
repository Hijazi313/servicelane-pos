# Web capability index

| Capability | Entry point | Status and constraints |
| --- | --- | --- |
| Staff access client | [Application](../src/app/app.tsx), [access operations](../src/features/access/access-api.ts), [screens](../src/features/access/access-screens.tsx), [routes](../src/app/router.tsx) | Login, required password change, server-checked home placeholder and logout source implemented with explicit paths. The user reports local HTTPS login, logout, re-login and hard refresh. Full route/session behavior and production hosting remain unverified; see [tracker](../../../docs/planning/frontend-access/phase-tracker.md). |

| Menu setup | [Menu page](../src/features/menu/menu-page.tsx), [drawer](../src/features/menu/menu-form.tsx) | Source implemented for administrators using existing Menu APIs. Browser, device and user acceptance remain pending; photo upload is disabled. [Plan and evidence](../../../docs/planning/frontend/initial-menu-setup.md). |
