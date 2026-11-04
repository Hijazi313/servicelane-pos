# Frontend access — phase tracker

Status: active. User requested login first, followed by protected home and logout. Scope and acceptance: [specification](spec.md); server mapping: [integration guide](frontend-integration.md); candidate browser checks: [test plan](test-plan.md); general guidance: [frontend testing workflow](../../quality/frontend-testing.md).

- [x] Implement session check, login, required password change, protected placeholder and logout in frontend source.
- [x] Four [API-client tests](../../../apps/web/tests/access-api.test.mjs) passed with synthetic responses using `node --experimental-transform-types --test apps/web/tests/access-api.test.mjs` (Node 24.18.1); strict TypeScript and Vite build passed with temporary Node 24.22.1. The build reports a chunk-size warning. These checks do not verify rendered UI or server integration.
- [ ] Verify browser flow with same-origin HTTPS and target devices when infrastructure and suitable test resources are authorized and available.
- [x] Add explicit login (`/login`), password-change (`/change-password`) and home (`/`) routes. A focused route-state mapping check, TypeScript and Vite build pass with Node 24.22.1; the build reports a chunk-size warning.
- [ ] Verify direct navigation, refresh, history and session gating in a browser, and verify route fallback under the eventual same-origin host. A route-state unit check is not browser-routing evidence.
- [x] Prepare the loopback HTTPS development proxy. A synthetic loopback test passed with a temporary certificate and mock API, covering forwarding, safe headers and unconfigured 503 behavior; Vite build passed with a chunk-size warning. This does not verify browser trust, backend configuration, session cookies or live login.

Separate acceptance and release remain pending. The user reported that Supabase connectivity worked after configuring the provider CA, the login form was visible and they were able to log in. The login report does not establish cookie attributes, password-change behavior, logout or complete route behavior; these remain unverified.

## Current handoff — 2026-11-04

- The user reports successful login. Exact steps, target, account provisioning history and cookie attributes were not provided; do not infer them. The agent did not independently verify the login.
- Next: resume frontend access with the user, clarify the desired next action and verify remaining browser behavior within authorized scope: logout, session/cookie behavior, direct navigation, refresh, history and gating. Password change and target-device checks remain unverified where applicable. Use the existing [test plan](test-plan.md); do not assume all checks are required immediately.
- Credentials stay out of chat, logs and command-line arguments. Database writes, migrations, provisioning and recovery require explicit target-specific authorization. If operator work is needed, read the [operator guide](../../../apps/api/src/operator/README.md) and establish target state before choosing an action.
- The user prefers an explanation of the reason and proposed action before commands or file changes, followed by their acceptance. Access acceptance and release remain pending; the build chunk-size warning remains recorded above.
- Incidents: none in this closeout; [INC-20261101-01](../../quality/agent-incidents.md#inc-20261101-01--existing-supabase-tls-context-omitted-from-troubleshooting) remains corrected and pending user review.

## Current handoff — 2026-11-01

Historical record; superseded by the 2026-11-04 handoff above.

- Next goal: help the user gain first administrator access. The user reports no user in the database table; the presence or absence of an installation, business and branch is not established. Do not assume an empty user table means the installation can safely be provisioned.
- [Operator guide](../../../apps/api/src/operator/README.md) distinguishes initial installation provisioning from recovery of an existing administrator. Review the target and existing state before recommending either. Provisioning, migrations and recovery write to the database and require explicit, target-specific authorization; do not run them based on this handoff.
- Keep credentials out of chat, logs and command-line arguments. The existing operator command requests passwords through hidden terminal input. Do not claim an administrator account or default credentials already exist.
- Continue to follow the user's instruction: explain the reason and proposed action first; do not run commands or change files until the user recommends or accepts the action. This closeout was explicitly requested.
- Browser navigation, trusted-cookie/session behavior, logout and target-device checks remain unverified. Preserve the build chunk-size warning and existing acceptance/release limits. Incident [INC-20261101-01](../../quality/agent-incidents.md#inc-20261101-01--existing-supabase-tls-context-omitted-from-troubleshooting) is corrected; user review remains pending.
