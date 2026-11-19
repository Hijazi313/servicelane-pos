# Frontend access — phase tracker

Status: active. User requested login first, followed by protected home and logout. Scope and acceptance: [specification](spec.md); server mapping: [integration guide](frontend-integration.md); candidate browser checks: [test plan](test-plan.md); general guidance: [frontend testing workflow](../../quality/frontend-testing.md).

- [x] Implement session check, login, required password change, protected placeholder and logout in frontend source.
- [x] Four [API-client tests](../../../apps/web/tests/access-api.test.mjs) passed with synthetic responses using `node --experimental-transform-types --test apps/web/tests/access-api.test.mjs` (Node 24.18.1); strict TypeScript and Vite build passed with temporary Node 24.22.1. The build reports a chunk-size warning. These checks do not verify rendered UI or server integration.
- [ ] Verify browser flow with same-origin HTTPS and target devices when infrastructure and suitable test resources are authorized and available.
- [x] Add explicit login (`/login`), password-change (`/change-password`) and home (`/`) routes. A focused route-state mapping check, TypeScript and Vite build pass with Node 24.22.1; the build reports a chunk-size warning.
- [ ] Verify direct navigation, refresh, history and session gating in a browser, and verify route fallback under the eventual same-origin host. A route-state unit check is not browser-routing evidence.
- [x] Prepare the loopback HTTPS development proxy. A synthetic loopback test passed with a temporary certificate and mock API, covering forwarding, safe headers and unconfigured 503 behavior; Vite build passed with a chunk-size warning. This does not verify browser trust, backend configuration, session cookies or live login.

## Current handoff — 2026-11-20

The user accepted and closed the [basic frontend foundation](../frontend/TRACKER.md). The broader access flow remains active pending a separate user decision.

The merged PR is present at `edf58d9` on local `main` and the cached `origin/main`. Its record reports six passing access, route and mock HTTPS proxy checks and a passing frontend typecheck. On local HTTPS the user reports login to the administrator welcome screen, logout, re-login and a successful hard refresh. The user additionally reports that the browser back button does not restore access after logout. The refreshed path and signed-out direct navigation remain unspecified.

Open checks include cookie attributes, password-change outcome, signed-out direct navigation, other browser-history cases, deployed route fallback and target devices. A session-check 403 can still show the password-change flow for an origin rejection. Production hosting and operational readiness remain unverified.

Next decision belongs to the user: select any further access verification or decide acceptance under stated limits. Database-backed checks require target-specific authorization. This closeout authorized documentation only.

Incidents: none in this closeout.

## Historical handoff — 2026-11-19

- The user reports successful login and seeing the initial administrator welcome screen after configuring the local HTTPS origin and trusted proxy, followed by successful logout and re-login. This is user-reported browser evidence, not independent verification of the full access flow.
- The development frontend now defaults to HTTPS on loopback port 5174 and refuses startup without its certificate; the mock proxy check passed. The API's local origin and proxy settings were corrected separately in ignored `.env`. An unauthenticated local request subsequently returned 401 instead of the earlier origin-rejection 403.
- Cookie attributes, refresh, direct navigation, history, session gating after logout and password-change outcome remain unverified. The client currently treats every session-check 403 as a possible password-change restriction, including an origin rejection; distinguish this limitation before treating the flow as accepted.
- Next: verify the smallest remaining browser behavior on the identified development target; session checks may update session activity and logout writes to the database, so obtain target-specific authorization for those actions. Do not repeat a password change with an unknown outcome. Credentials stay out of chat and arguments. Acceptance, release and publication remain separate.
- Incidents: none in this handoff; [INC-20261101-01](../../quality/agent-incidents.md#inc-20261101-01--existing-supabase-tls-context-omitted-from-troubleshooting) remains pending user review.

## Current handoff — 2026-11-04

Historical record; superseded by the 2026-11-19 handoff above.

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
