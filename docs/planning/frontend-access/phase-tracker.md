# Frontend access — phase tracker

Status: active. User requested login first, followed by protected home and logout. Scope and acceptance: [specification](spec.md); server mapping: [integration guide](frontend-integration.md); candidate browser checks: [test plan](test-plan.md); general guidance: [frontend testing workflow](../../quality/frontend-testing.md).

- [x] Implement session check, login, required password change, protected placeholder and logout in frontend source.
- [x] Four [API-client tests](../../../apps/web/tests/access-api.test.mjs) passed with synthetic responses using `node --experimental-transform-types --test apps/web/tests/access-api.test.mjs` (Node 24.18.1); strict TypeScript and Vite build passed with temporary Node 24.22.1. The build reports a chunk-size warning. These checks do not verify rendered UI or server integration.
- [ ] Verify browser flow with same-origin HTTPS and target devices when infrastructure and suitable test resources are authorized and available.
- [x] Add explicit login (`/login`), password-change (`/change-password`) and home (`/`) routes. A focused route-state mapping check, TypeScript and Vite build pass with Node 24.22.1; the build reports a chunk-size warning.
- [ ] Verify direct navigation, refresh, history and session gating in a browser, and verify route fallback under the eventual same-origin host. A route-state unit check is not browser-routing evidence.

Separate acceptance and release remain pending. The Vite server does not yet provide the trusted same-origin HTTPS proxy required by the authentication contract, so a working browser login has not been verified. No backend, deployment, database or credential changes are included.
