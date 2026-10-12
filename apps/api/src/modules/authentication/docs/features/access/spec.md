# Authentication and Access — Specification

Status: BA-D02 identity/credential and initial-administrator bootstrap rules approved for BA-01 on 2026-10-12. HTTP authentication/session mechanisms remain proposed and inactive.
Ownership: Authentication/Access module. Progress: [phase-tracker.md](../../../../../../../../docs/planning/business-access/phase-tracker.md).
Dependency: [Business/Branch specification](../../../../business/docs/features/foundation/spec.md).

## Outcome and provenance

Restaurant administrators provision and control staff accounts; staff log in locally and perform only authorized actions for the installation's business and permitted branch. Internet loss does not introduce a mandatory cloud login dependency.

[Architecture policy](../../../../../../../../docs/architecture/README.md#business-branch-and-access-foundation) establishes staff lifecycle, secure credentials, sessions, disabling/revocation and server-enforced access as product P0. The user subsequently approved BA-D01/BA-D02/BA-D05, including identity, credential and fixed-role direction. BA-01 implements initial administrator persistence only. Later lifecycle, enforcement and recovery implementation require BA-02 authorization; BA-D03 session technology is still open.

## Proposed P0 requirements

| ID | Requirement | Why needed / simpler alternative |
| --- | --- | --- |
| AA-R01 | Controlled administrator bootstrap and authenticated staff lifecycle | Accounts must be created, corrected, disabled and recovered without public signup/manual database edits. Reuse joint provisioning; no invitation/email service. |
| AA-R02 | Local username/password login with adaptive password hashing and abuse controls | LAN clients still need identity; plaintext/reversible passwords and unrestricted guessing are unacceptable. No external identity service or short shared PIN login. |
| AA-R03 | Server-controlled sessions, logout, expiry and prompt revocation | Disabled staff and stolen sessions must lose access. Propose opaque sessions with server state rather than a stateless token plus revocation framework. |
| AA-R04 | Default-deny business, branch and action authorization on every protected operation | Client IDs and hidden UI do not enforce permissions. A fixed small role matrix is simpler than a permission designer. |
| AA-R05 | Recover access locally with attributable privileged operations | Email/internet recovery would break the approved topology. Operator command requires host-level authorization, never an unauthenticated recovery endpoint. |

## Proposed identity and role rules

- Own staff account `{id, businessId, username, displayName, status, role}`, credential hash, explicit branch grant, server sessions and minimal security-event records. Business IDs must match the installation; branch grants must pass Business ownership validation. Never cascade-delete business history when disabling staff.
- Proposed roles are `administrator` and `staff`. Both may read their authorized context, change their own password and log out. Only administrators may list/create/edit staff, change role/grant, disable/re-enable accounts and initiate managed password reset. Neither role has implicit permissions in Menu, Orders or Payments; their modules will add explicit action policy later.
- Initially grant the one operational branch explicitly, including to administrators. No implicit access to every future branch. Reject role or branch-grant input not defined by this specification.
- Propose usernames normalized to lowercase ASCII, 3–64 characters from letters, digits, dot, underscore and hyphen, unique within the installation. Passwords are never trimmed or silently truncated. Propose passwords of 15–128 characters, permitting spaces/Unicode, without composition rules or routine forced rotation; validate length consistently. Hash using a maintained Argon2id implementation, with cost parameters reviewed against current guidance and measured on the target host before release. No library installation is authorized by this document.
- Do not allow disable/demotion of the last active administrator. Serialize concurrent admin-removal attempts. Failed operations leave account/grant/session state unchanged. Re-enabling never restores revoked sessions.
- Account creation/reset uses a password entered over a protected channel; propose forced password change before any ordinary operation. That restricted session may only change password or log out. A password change rotates session identity and revokes all other sessions. Reset/disable/grant or role changes revoke existing sessions within the same account-change transaction.

## Proposed session and failure rules

- Same-origin browser client and API over trusted LAN HTTPS; opaque random session in a Secure, HttpOnly, SameSite cookie, with no broad Domain setting. Store only a token digest server-side, bound to this installation/account. No browser local-storage bearer token. Session fixation must fail; always issue a fresh token after login/password change.
- Propose 30-minute idle and 12-hour absolute expiry, enforced by the server clock. No remember-me or concurrent-device limit in this increment; logout revokes the current session. Disable/reset revokes all sessions. After a revocation transaction commits, subsequent authorization checks fail; requests already authorized may finish. Sensitive staff administration rechecks authorization in its mutation transaction so concurrent privilege revocation cannot be bypassed.
- Verify current account status, branch grant and action permission on every protected request; never trust cached client role. Persistence failure denies access rather than falling back to cached authority. Revoked/expired/foreign-installation session returns 401; authenticated insufficient action permission returns 403. Scope-sensitive missing/foreign resource returns 404 without identifying another business.
- All state-changing cookie-authenticated requests require CSRF protection, including login/logout: validate allowed Origin and a server-issued CSRF token; use safe methods only for reads. Restrict credentialed origins to configured client origin, never wildcard. Propose a public same-origin CSRF-token bootstrap operation that exposes no business data.
- Invalid, unknown and disabled-account login returns the same generic 401. Propose bounded account-key and source-address throttling with progressive short delays/429, without permanent lockout or exposing account existence. Exact thresholds, storage and restart behavior must be settled under BA-D03 before implementation; no Redis or external CAPTCHA dependency assumed.
- Security events record actor/target IDs, action, timestamp, success/failure and local operator identity where applicable; never passwords, raw session/CSRF tokens or request bodies. Logs are protected locally; retention and operator identity custody must be settled before deployment.
- Credentials/sessions never travel over plain LAN HTTP. Restoring a backup must invalidate pre-restore sessions before serving traffic; production recovery design owns the exact procedure. Automatic restore/failover is outside this phase.

## Proposed interfaces

No machine-readable contract exists yet. Route suffixes below are proposed; API version/prefix is BA-D06, not selected here. Public endpoints are narrowly justified: technical `/health` remains as accepted; login and CSRF bootstrap allow authentication. Staff management and context require authentication.

| Operation | Inputs | Outcome |
| --- | --- | --- |
| `GET /auth/csrf` | Same-origin browser bootstrap | CSRF token and matching protected state; no account/business data |
| `POST /auth/login` | Username, password, CSRF proof | Session cookie; safe account ID, role, permitted branch and password-change-required flag; no token in JSON |
| `POST /auth/logout` | Session/CSRF | 204 and expired cookie; repeated logout succeeds without restoring a session |
| `GET /auth/me`, `GET /context` | Session | Safe current identity and authorized installation context; never credential/hash/session internals |
| `POST /auth/password` | Current and new password; session/CSRF | Change credentials, rotate current session, revoke other sessions; forced-change restriction cleared |
| `GET /staff`, `POST /staff` | Administrator; create uses username/display name/role/branch/password | Business-scoped safe list or created identity; duplicate username 409 |
| `PATCH /staff/:id` | Administrator; explicit allowed display/role/grant/status fields | Updated safe identity; restricted fields rejected, changes revoke sessions |
| `POST /staff/:id/password-reset` | Administrator and securely supplied temporary password | Force password change; revoke all sessions, no password echoed |
| Operator `recover-administrator` | Explicit local business/account, verified operator identity and securely entered replacement password | Recover an existing administrator, revoke sessions and require change; no public endpoint or universal bypass credential |

Use 400 for invalid input, 401/403/404 as above, 409 for conflicts/last-administrator removal, 429 for throttling and sanitized 503 for unavailable persistence. Do not disclose raw SQL, credentials or foreign existence. No hard delete or arbitrary bulk staff export. The privileged operator command is outside normal HTTP role permissions and requires a separately approved operational runbook; application source cannot prove host access was authorized.

## Acceptance examples

### AA-AC01 — Staff lifecycle and permissions

Bootstrap an administrator through BB-AC02. Create staff, require initial password change, then read context. Staff cannot list/create/manage another account, set an arbitrary role or change their own grant. Admin can edit/disable/re-enable permitted staff; last-active-admin removal and concurrent removal are rejected. Inspect persisted credentials: hashes only, no password returned or logged. Evidence: focused credential/authorization checks and user-run local lifecycle; hash source review is not a login result.

### AA-AC02 — Login and browser session

Correct credentials create a fresh session; wrong password, unknown username and disabled account give the same generic response. Throttle under the agreed policy. Cookies have agreed protections; no raw token in response body/logs. Expired, forged and installation-B sessions fail on A. Missing/invalid CSRF and unapproved origins cannot mutate state or establish a session. Evidence: HTTP/cookie checks and browser acceptance on trusted HTTPS once separately authorized; source review alone does not establish browser behavior.

### AA-AC03 — Revocation and concurrency

Log in on two devices. Logout revokes one; password change/reset/disable/role or branch-grant change invalidates the required sessions. Following commit, the next request is rejected; re-enable does not resurrect a token. Exercise sensitive-admin mutation racing with revocation and verify transactional recheck. Test idle/absolute expiry with a controllable clock. Evidence: focused session/integration behavior, not assumptions from token contents.

### AA-AC04 — Local recovery and denial on failure

Authorized operator recovers an existing administrator without internet or manual SQL; old sessions/password fail and replacement requires change. Record safe operator event. Ordinary staff/unauthenticated HTTP cannot invoke recovery. Database outage causes login and protected operations to fail closed with sanitized errors. Host operator authorization and backup session invalidation need operational evidence before release.

### AA-AC05 — Business and branch isolation

User A cannot access B by replaying cookies or changing business, account or branch IDs. Reject an ungranted branch belonging to the same business as well as a foreign branch. Use a focused disposable fixture for non-operational branch cases when database writes are separately authorized; this does not activate multi-branch product operation. Ensure unprotected routes are limited to the stated exceptions. Evidence: integrated negative checks plus source review of route policy coverage.

## Review decisions, deferrals and guidance

BA-D01/BA-D02/BA-D05 are approved directions with implementation limited to BA-01; session controls and HTTP versioning remain open under BA-D03/BA-D04/BA-D06 in the [tracker](../../../../../../../../docs/planning/business-access/phase-tracker.md#review-decisions). No frontend integration document is needed until a frontend consumer is scoped; these proposed semantics must be reconciled with its contract then.

P1: public signup/invitations, email reset, custom permission designers, SSO and multi-factor identity integration; local controlled lifecycle is the proposed first fit, subject to operational threat review. A legal/contractual requirement or actual exposure may change priorities. Future module permissions, frontend, printing and trading flows are not included.

Engineering guidance, checked 2026-10-12: OWASP recommends adaptive password hashing, protected session cookies, server-enforced expiration/revocation and generic authentication errors. These inform proposals, not a legal compliance claim: [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Follow [compliance policy](../../../../../../../../docs/compliance/README.md) for personal-data minimization, protected logs/backups and retention applicability; no retention period or certification is invented here.
