# Business/Branch and Authentication/Access — Joint phase tracker

Parent: [global tracker](../TRACKER.md). Owner: primary agent; BA-02 assignments in [collaboration record](../../../apps/api/src/modules/authentication/docs/features/access/agent-collaboration.md).
Specifications: [Business/Branch](../../../apps/api/src/modules/business/docs/features/foundation/spec.md), [Authentication/Access](../../../apps/api/src/modules/authentication/docs/features/access/spec.md).
Status: BA-01 complete, accepted on 2026-10-12. BA-02 complete, accepted by user on 2026-10-17 under the revised development acceptance scope below. BA-03 remains proposed and inactive.

## Authorization

Historical planning record; the implementation and staging-acceptance authorizations below supersede its planning-only boundary for BA-01.

2026-10-12 user approved one-business LAN installation, dedicated local PostgreSQL, local client assets and one maintained codebase, and instructed preparation of both specifications with proposed P0 IDs/acceptance outcomes. This authorizes BA-00 planning only. No implementation, installs, database writes, provisioning, deployment or later-phase activation.

A subsequent message said “I approve sppecific decisions and phast/task in tracker” without identifying decisions, IDs or tracker. It does not resolve the proposals below or activate implementation. The concrete planning-only authorization above remains the boundary.

Assignment: this planning pack, global tracker and topology/scope references needed to remove active contradictions. Preserve staged skill/workflow changes and existing tracker edits; no index, branch, commit or push operations. Follow [verification policy](../../project-scope.md#verification-policy).

## BA-01 authorization — 2026-10-12

User explicitly approved BA-D01, BA-D02 and BA-D05 and authorized BA-01-T01/BA-01-T02 only: Business/Branch schema, validated installation binding and atomic operator provisioning including the first administrator. Necessary dependency installation is permitted. Database writes, migration application, infrastructure provisioning and deployment are prohibited. BA-02/BA-03, HTTP authentication/sessions and adjacent features remain inactive. This supersedes the earlier planning-only boundary for these tasks only.

Solo assignment: API Business and Authentication bootstrap slices, technical transaction context, operator entry point, reviewed offline migration artifacts, focused non-database checks and owning documentation. Preserve all existing staged files; no stage/unstage/commit/push. Expected completion is source plus focused offline evidence; BB-AC01/BB-AC02 database behavior stays pending, so BA-01 cannot close under this authorization alone.

| Active P0 task | Status | Acceptance / expected evidence |
| --- | --- | --- |
| BA-01-T01 | complete | [BB-AC01](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac01--explicit-ownership-and-configuration): schema, validated binding, offline validation and staging persistence passed; see closeout |
| BA-01-T02 | complete | [BB-AC02](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac02--atomic-and-repeatable-provisioning): actual operator, shared PostgreSQL transaction, rollback/concurrency/retry passed; see closeout |

## BA-02 authorization — 2026-10-12

User explicitly approved the dated implementation-review design, BA-D03/BA-D04/BA-D06 and service/hash treatment, and authorized BA-02-T01/T02/T03 source implementation only. Record of instruction: “Start BA-02 … Authorize BA-02-T01/T02/T03 source implementation only. Record this authorization before implementation.”

Deliver lifecycle, versioned authentication/staff/context HTTP interfaces, sessions/CSRF/throttling, access enforcement, local recovery, reviewed offline migrations and focused database-free checks. No installation, database connection/write, migration application, provisioning/deployment, TLS trust changes, frontend, Swagger or BA-03. Existing BA-01 staging authorization does not extend to BA-02. Missing necessary dependencies require scoped approval; independent work continues. Historical source-only boundary; current status is governed by [BA-02 acceptance and deferred verification](#ba-02-acceptance--2026-10-17).

| Active P0 task | Status | Acceptance / expected evidence |
| --- | --- | --- |
| BA-02-T01 | complete; user accepted 2026-10-17 | AA-AC01; lifecycle/last-admin/credentials and bootstrap regressions, offline migrations |
| BA-02-T02 | complete; user accepted 2026-10-17 | AA-AC02/03; injection/clock/CSRF/throttle/session checks; database/browser evidence deferred |
| BA-02-T03 | complete; user accepted 2026-10-17 | AA-AC01/03/04; action/branch denial, transactional recheck and local recovery boundary |

Completion shape: accepted backend development increment with scoped staging evidence; deferred verification and release limits are owned by [BA-02 acceptance and deferred verification](#ba-02-acceptance--2026-10-17). Assignment and shared-file ownership: [collaboration record](../../../apps/api/src/modules/authentication/docs/features/access/agent-collaboration.md). Preserve the three pre-existing planning-document edits; no Git index/branch/commit/push changes.

## Phase and task IDs

BA-00, BA-01 and BA-02 are complete; BA-02 user acceptance revises its verification exit scope as recorded below. Later rows are proposed sequencing and scope handles for review; approving a specification is separate from authorizing a row. Database execution/installation permissions must be explicit when an implementation phase needs them.

| Phase | Proposed P0 tasks / outcome | Status | Exit criteria / evidence |
| --- | --- | --- | --- |
| BA-00 | BA-00-T01 record topology; BA-00-T02 draft linked specifications; BA-00-T03 reconcile tracking/review decisions | complete | Topology approval recorded; both specs and proposed task/acceptance links prepared; documentation checks only |
| BA-01 | BA-01-T01 Business/Branch schema and validated binding; BA-01-T02 atomic operator bootstrap including first administrator | complete | [BB-AC01](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac01--explicit-ownership-and-configuration), [BB-AC02](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac02--atomic-and-repeatable-provisioning); reviewed first migration and focused authorized runtime evidence |
| BA-02 | BA-02-T01 staff lifecycle/credential policy; BA-02-T02 local login, sessions and revocation; BA-02-T03 branch/action enforcement and controlled recovery | complete; user accepted | [AA-AC01](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac01--staff-lifecycle-and-permissions), [AA-AC02](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac02--login-and-browser-session), [AA-AC03](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac03--revocation-and-concurrency), [AA-AC04](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac04--local-recovery-and-denial-on-failure) |
| BA-03 | BA-03-T01 integrated context and two-installation access acceptance | proposed | [BB-AC03](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac03--independent-installations), [BB-AC04](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac04--fail-closed-on-invalid-context), [AA-AC05](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac05--business-and-branch-isolation), plus accepted BA-01/BA-02 |

BA-01 needs approved shared provisioning/transaction and credential contracts from both specs; it implements only the administrator bootstrap slice of Authentication. BA-02 builds remaining lifecycle and HTTP access on that boundary. BA-03 must pass before Menu implementation is proposed. Detail implementation checklists only upon specific phase activation; no later business module is activated by this pack.

## Review decisions

BA-D01/BA-D02/BA-D05 were approved for BA-01; BA-D03/BA-D04/BA-D06 and the review design are now approved for BA-02 source implementation. Activation is the explicit BA-02 authorization above, not merely the decision table.

| ID | Proposed choice / question | Impact and review boundary |
| --- | --- | --- |
| BA-D01 | Operator-command initial provisioning; one cross-module transaction; local privileged command for administrator recovery | Approve bootstrap/recovery responsibility and transaction ownership before BA-01. Host operator identity/custody requires a runbook before deployment. |
| BA-D02 | Local normalized username/password, administrator/staff roles, explicit initial branch grant and forced initial/reset password change | Approve role matrix and credential policy before implementing account schema/credentials in BA-01/BA-02. No shared PIN or cloud identity dependency. |
| BA-D03 | Recommend PostgreSQL opaque sessions, 30-minute idle/12-hour absolute expiry, synchronizer CSRF, fixed-window atomic throttling | Detailed policy and acceptance cases in the [BA-02 design](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#ba-d03--session-csrf-and-bounded-login-work); approved for BA-02 source; runtime acceptance pending. |
| BA-D04 | Recommend one canonical HTTPS origin; separate backend checks from trusted-browser acceptance | [Acceptance boundary](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#ba-d04--origin-and-https-acceptance-boundary); deployment/trust provisioning separately authorized. |
| BA-D05 | Validated business/branch configuration and installation binding; no editor in first increment | Approve initial fields/validation and controlled setup before BA-01. Operator/backup custodian, host/power ownership and downtime/data-loss targets remain open before deployment. |
| BA-D06 | Recommend `/api/v1`, separate semantic release/build identity, defer Swagger generation/UI | [Version/documentation scope](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#ba-d06--api-and-release-identification-swagger-boundary); approved for BA-02 source; runtime acceptance pending. |

## Initial implementation evidence (historical; superseded by closeout)

2026-10-12 source discovery found only technical foundation capabilities before BA-01. Implemented source now adds Business/Branch/binding schemas and private adapters; Authentication staff/credential/grant schemas and initial administrator capability; opaque transaction context; dedicated Nest operator composition and hidden-password CLI. Module-owned [Business](../../../apps/api/src/modules/business/docs/README.md) and [Authentication](../../../apps/api/src/modules/authentication/docs/README.md) indexes own public capability discovery. Module specifications moved beside code; this joint tracker remains the canonical cross-module delivery/authorization record, and incoming links were repaired.

| Criterion / check | Evidence on 2026-10-12 | Limits / result |
| --- | --- | --- |
| BB-AC01 validation and schema | API TypeScript no-emit passed; focused validation tests passed; generated and reviewed six-table SQL/snapshot/journal offline | Input behavior checked; provision/readback persistence and runtime constraints remain pending |
| BB-AC02 transaction orchestration | Source review of advisory lock, single Drizzle transaction context, sequential module writes and rejection on existing records; focused transaction-double tests passed | Real PostgreSQL rollback, concurrent bootstrap, repeated initialization and correction/retry are unverified |
| Initial administrator credential/input slice | Real Argon2id PHC hashing/derivation and randomized salts checked; identity/password/privilege-injection tests passed | No login, session, access enforcement, recovery or full AA-AC01 acceptance claimed; Node Argon2 API is experimental |
| Operator entry | Hidden-input and terminal-restoration tests; subprocess rejects missing args/non-TTY; Nest operator composition resolves with zero pool connections; result IDs only and generic failures inspected | No database-backed CLI invocation, actual provision or physical terminal/device acceptance performed |
| Offline SQL | `drizzle-kit generate --config=drizzle.config.ts --name=business_bootstrap`; SQL and metadata reviewed; Drizzle migration-file parsing checked | No application, history-table creation, repeatability or recovery execution |
| Focused checks | 11 Node tests passed after API compilation to ignored `dist/ba01-check`; diff whitespace and affected link/heading checks passed | Uses existing TypeScript/Node tooling; no production build, dependency installation or database access |

At initial implementation, BA-01-T01/T02 source was implemented with acceptance pending. The closeout below records subsequent database acceptance. Operator outputs only IDs and writes no data until explicitly invoked. Normal HTTP AppModule is unchanged: no business endpoints, staff login/session enforcement, automatic migrations or startup provisioning. Existing forced-password-change state is persistence only; enforcement belongs to BA-02. BA-02/BA-03 remain inactive.

Foundation remains accepted. [Canonical foundation handoff](../project-foundation/phase-tracker.md#current-handoff--2026-10-12) and [acceptance limits](../../acceptance/project-foundation.md#deferred-checks-and-limits) remain authoritative: first-real-migration application/repeatability/risk-appropriate recovery, pinned-toolchain clean install, shutdown/session release, fault recovery, database version/mode/budget and trusted TLS remain unverified. Observed verification tools: Node 24.18.1 rather than pinned 24.21.0; TypeScript 6.0.3. No dependency or lockfile change was needed. Built-in Argon2id avoids a new package, but experimental API stability and target-host cost still require review before release.

Current configuration always enables database TLS and startup provides no LAN HTTPS/client assets. Those deployment gaps require their separately approved scope. Database-independent source tests cannot prove internet-independent production operation.

## Closeout — 2026-10-12

User confirmed staging was empty with nothing to preserve, authorized testing and instructed closure once all checks passed. BA-01-T01/T02 and BB-AC01/BB-AC02 are complete based on real PostgreSQL acceptance, not only doubles. [Sanitized machine-readable results](../../../apps/api/tests/evidence/ba01-staging.json); manual harness: [staging-acceptance.mjs](../../../apps/api/tests/staging-acceptance.mjs).

| Outcome | Evidence / result |
| --- | --- |
| Migration application/repeatability | Actual delivered migrator applied the first migration; rerun retained exactly one history entry and six tables |
| Risk-appropriate migration recovery | First migration's DDL executed in a real transaction; controlled SQL failure and rollback left no application tables, then actual migration applied successfully |
| Explicit configuration/ownership | Actual hidden-terminal operator provisioned synthetic restaurant/branch; public context matched name, PKR, Asia/Karachi and returned IDs; invalid configuration and missing binding rejected |
| Administrator slice | Persisted active administrator, required-password-change flag, correct explicit branch grant and PHC Argon2id hash; hash derivation checked without recording passwords/hashes |
| Repeat/concurrent setup | Repeat rejected without replacing data; two concurrent real transactions produced exactly one complete installation with no orphan records |
| Atomic failure and retry | Temporary credentials trigger caused a real PostgreSQL failure after initial writes; all six tables remained empty after rollback; removing trigger allowed successful corrected retry |
| Cleanup | Removed failure trigger/function and all synthetic records; six application tables plus one Drizzle migration-history entry retained |
| Source regression checks | TypeScript compilation passed; 12 focused Node tests passed, including real pseudoterminal exit regression; diff whitespace and relative-link checks passed |

Acceptance found and fixed a terminal cleanup defect: fresh stdin has `readableFlowing=null` even when `isPaused()` is false, so the CLI could complete setup but keep running. The reader now restores a non-flowing stream to paused state; the real-terminal regression and full database-backed CLI pass. A test-harness-only correction also recognizes PostgreSQL errors wrapped by Drizzle. The final evidence includes first-migration rollback from the initial run; resume mode cannot re-establish that initial empty-schema scenario and is explicitly marked not rerun on future harness resumes. No new business features introduced.

Observed PostgreSQL version: 17.11. Runtime/migration connection settings were identical; details/secrets omitted. Initial sandbox DNS failure required approved network escalation. Staging uses the existing explicit `DATABASE_TLS_VERIFY=false` exception; these results do not prove trusted TLS. Node 24.18.1 still differs from pinned 24.21.0; clean pinned installation remains pending. Provider connection mode/budget, API graceful shutdown/fault recovery, LAN HTTPS/assets, backup/restore and production readiness remain deferred. No BA-02 lifecycle/login/session acceptance claimed. The first migration's limited additive-DDL recovery does not prove backup/restore or future destructive-migration recovery.

## Current handoff — 2026-10-12

- BA-01 remains accepted/closed. BA-02-T01/T02/T03 source is complete, awaiting acceptance; BA-02 is not closed. BA-03 remains inactive. All BA-D01–06 decisions and the dated review design were approved; runtime execution was not.
- Source delivers `/api/v1` staff lifecycle, local login/session/CSRF/throttling, branch/action denial, revocation and operator recovery. HTTP origin/proxy configuration is explicit; no TLS/assets/frontend/Swagger or rollout packaging is delivered. [Current contracts](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#source-contract-details--ba-02).
- Existing three planning-document edits were preserved and extended. New source, focused tests, offline second migration/metadata and owning docs are uncommitted. No index/branch/commit/push operations. [Assignments](../../../apps/api/src/modules/authentication/docs/features/access/agent-collaboration.md) own agent file boundaries; primary reconciled source and final checks.
- No installation, database connection/write, migration application, provisioning, deployment, TLS trust change or real-browser test occurred. Staging is unchanged: first migration and six empty application tables. Existing BA-01 evidence remains historical and intact; its six-table acceptance harness must not be reused for BA-02.
- Next action: review the [proposed staging acceptance plan and prompt](#ba-02-staging-acceptance-plan--2026-10-17); execution remains unauthorized. All three reported review findings have source corrections with focused evidence: [logout](#logout-review-correction--2026-10-15) and [remaining findings](#remaining-review-corrections--2026-10-17). Database execution still requires separate authorization. Include second migration, lifecycle/recovery, real races, worker/restart counters, cleanup and outage behavior; trusted-HTTPS browser acceptance and target-host hashing require their own operational prerequisites. Do not activate BA-03 or close BA-02 on source-only evidence.

## BA-02 source evidence — 2026-10-12

| Criterion / check | Evidence / result | Limits |
| --- | --- | --- |
| AA-AC01 lifecycle/roles | Serialized application-double checks cover forced change, safe output, role denial and last-active-admin rejection including concurrent removals | PostgreSQL locking/rollback and real lifecycle acceptance pending |
| AA-AC02 login/CSRF/throttles | Generic unknown/disabled/wrong failures, single-use pre-login state, expiry, fixed windows, pending attempts, source/account capacities and hash saturation checked; real Nest/Fastify injection covers origin/Host/protocol, cookies, no token JSON, default deny, limits/errors and no CORS | Application doubles and HTTP service stubs are separate layers; no real database-backed HTTP or trusted-browser/TLS acceptance |
| AA-AC03 revocation/concurrency | Clock boundaries, rotation, reset/disable/re-enable, multiple logical sessions and revocation during hash work checked against a serialized store double | Real cross-worker/restart persistence, database races and device behavior pending |
| AA-AC04 recovery/fail-closed | Application recovery/foreign target/outage checks; CLI rejects invalid args/non-TTY before connection; actual Nest operator composition resolves with zero pool connections | No recovery invocation, database outage or host-custody acceptance; restore invalidation remains operational gate |
| BA-01 regressions | 12 existing Node tests passed after current source compilation to ignored `dist/ba01-check`; bootstrap public entry, shared scope, terminal handling and zero-connection operator composition retained | Historical staging evidence not rerun; no BA-02 database claim |
| BA-02 focused checks | `pnpm test:access`: TypeScript compilation and 23 Node tests passed (11 application, 6 HTTP/configuration, 4 credential/bootstrap, 2 recovery boundary) | No installed tooling or production build; serialized doubles do not prove PostgreSQL semantics |
| Offline migration | Generated/reviewed `0001_staff_access.sql`, snapshot and journal; migration-file parsing reads two artifacts; new snapshot chains to previous ID and preserves all six original table definitions exactly | Four added tables only; not applied, no runtime/recovery proof |
| Source/diff/docs | Reviewed scope, bootstrap service split, bounded PHC adapter, short locking transactions/post-hash rechecks; whitespace and changed-document relative links passed | Source review is not runtime acceptance |

Review corrected non-ASCII CSRF input handling so invalid equal-character-length input returns 403 rather than a timing-safe comparison exception/503; regression covered. Technical `/health` retains accepted 200/503 response bodies and is explicitly public; health/database behavior is stubbed in HTTP regression checks. Successful administrator mutations refresh idle time before any self-revocation, preserving revocation. Denied mutations retain safe actor/validated target IDs in failure events without recording request bodies; focused regression passed in the final 23-test run.

Observed Node 24.18.1 and pnpm 9.15.0 differ from pinned Node >=24.21.0 and pnpm 12.11.2. Experimental Argon2 compatibility and target-host memory/latency/concurrency remain release gates. No new dependency was necessary. Trusted database TLS, connection mode/budget, shutdown/fault recovery, backup/restore and LAN trust/assets remain deferred as previously recorded. Release identity is a defined contract only; no release packaging/automation claim.

## BA-02 planning review — 2026-10-12 (historical; subsequently approved)

User requested planning only: resolve BA-D03/04/06, review service placement and experimental hashing, recommend justified P0, update specification/tracker and prepare authorization. This instruction authorizes documentation only and does not approve the recommended design.

| Proposed task | Review status / scope | Acceptance and expected evidence |
| --- | --- | --- |
| BA-02-T01 | proposed, ready for authorization review: lifecycle, credential verification, application/persistence separation preserving bootstrap | AA-AC01; focused fixed-role/last-admin/credential and BA-01 regression checks; offline migration review; persistence races pending authorized database evidence |
| BA-02-T02 | proposed, ready for authorization review: login, session/CSRF/throttle policy, versioned HTTP boundaries | AA-AC02/03; focused injection/clock/parallel-counter checks; actual shared PostgreSQL and trusted-browser checks remain pending until authorized |
| BA-02-T03 | proposed, ready for authorization review: explicit branch/action enforcement, local recovery, fail-closed behavior | AA-AC01/03/04; negative policy and operator-boundary checks; actual recovery/outage/concurrency evidence pending authorized runtime acceptance |

Simplest justified P0: reuse Nest/Fastify and PostgreSQL; one API version and client origin; no Redis, JWT revocation framework, generic repository/permission engine, frontend or Swagger package. Preserve existing Argon2id PHC hashes behind a private verification adapter; explicitly retain experimental-runtime and host-load release gates. Detailed intended behavior and P1 exclusions live in the specification, not this tracker.

Planning evidence: inspected current public exports, Nest composition, bootstrap orchestration, hash adapter and package capabilities; checked current primary Node/OWASP/Nest guidance. Documentation whitespace and relative-file-link checks passed for all three changed documents. No implementation tests rerun for documentation; no runtime, database, browser, TLS, capacity benchmark or release acceptance claimed. BA-01 evidence is preserved, not newly reproduced.

### Concrete implementation-authorization prompt (historical; user subsequently supplied it)

```text
Approve the BA-02 review design dated 2026-10-12 in
apps/api/src/modules/authentication/docs/features/access/spec.md,
including BA-D03, BA-D04, BA-D06 and the service/hash-adapter treatment.
Authorize source implementation of BA-02-T01/T02/T03 only from
docs/planning/business-access/phase-tracker.md. Follow AGENTS.md and
spec-driven-delivery. Record this approval before implementation.

Deliver the specified lifecycle, /api/v1 authentication/staff/context,
sessions/CSRF/throttling, access enforcement and local recovery, plus
reviewed offline migration artifacts and focused database-free checks.
Preserve BA-01 public bootstrap behavior, work and evidence. Use the
existing experimental Node Argon2id adapter behind the specified bounded
verification boundary; retain pinned-runtime and target-host release gates.

No dependency installation is authorized. If a necessary Fastify-compatible
dependency is missing, identify the exact package/purpose and obtain scoped
installation authorization before that dependent work. Do not substitute
unsafe custom cryptography to avoid this boundary.

Do not connect to or write databases, apply migrations, provision/deploy,
change TLS trust, build a frontend, add Swagger or activate BA-03. Database
acceptance, trusted-HTTPS browser acceptance and target-host benchmarking
remain separately authorized follow-ups. Report source completion as awaiting
acceptance; do not close BA-02 without its required evidence. Update the
specification/tracker with actual contracts, checks and remaining limits.
```

This prompt is a proposed future user instruction; its presence here is not authorization. If dependency approval is needed, source work that does not depend on it can continue. No BA-02 activation occurred in this review.

## Verification follow-up — 2026-10-12

User requested verification and an easy-to-understand handoff. Refreshed staged checkout, scope and module/tracker guidance. Recompiled API to ignored `dist/ba01-check` and reran the 11 focused Node tests: all passed. Diff whitespace check passed. User clarified that only staging exists, with no disposable target; no connection, migration application or provisioning execution was attempted; database-backed acceptance remains pending. No later phase activated.

Plain-language handoff: Business describes the restaurant and its initial location, validates settings and explicitly binds the installation to that business/branch. Authentication currently supplies only the first administrator record, salted password hash and branch grant; it does not yet let staff log in or enforce sessions/permissions. The operator command coordinates both in one transaction; the SQL migration describes their six database tables. Specifications define intended behavior, module READMEs index supported capabilities, tests record focused checks, and this tracker owns authorization/evidence/pending acceptance. The next usable outcome is verified restaurant setup, not a working POS or login screen.

## Staging acceptance authorization — 2026-10-12

User confirmed staging is empty with nothing to preserve, explicitly authorized BA-01 testing there and requested closure if all criteria pass. This supersedes the earlier database-write restriction for BA-01 acceptance on the configured staging database only: migration application/rerun, synthetic provisioning records, concurrent attempts, controlled rollback/failure and cleanup of test-owned artifacts/data. No provider/production/Odoo changes or BA-02/BA-03 activation. Existing staged work remains preserved.

## Logout review correction — 2026-10-15

User selected the review finding where logout cleared browser cookies without revoking an active server session, and explicitly requested a fix. Authorization is limited to that source correction, focused database-free regressions and owning documentation; existing no-install/database/deployment/BA-03 restrictions remain. Intended behavior: active sessions require matching session-bound CSRF; successful logout revokes before clearing cookies. Expired/revoked/absent sessions retain the approved pre-login fallback. Source correction complete: an active session is checked with the existing sessionActive/CSRF helpers before pre-login fallback, inside the existing serialized transaction. The controller still clears cookies only after successful completion. The separate forced-password-change and pending-login-reservation findings are outside this correction and remain open.

Evidence on 2026-10-15: new active-session regression failed against the original source (unexpected successful logout), then passed after the correction. API TypeScript compilation passed. Five focused application/HTTP checks passed, covering unrelated/missing/random/non-ASCII CSRF rejection, unchanged authority after rejected logout, replay rejection after valid logout (including an unrelated pre-login cookie), repeated logout, expired/revoked/absent fallback and no cookie clearing on a 403. Fresh read-only boundary investigation and candidate review found no concrete surviving bypass or compatibility regression. No database access, installation, migrations or deployment; PostgreSQL and browser acceptance remain unverified. Observed Node 24.18.1 remains below the pinned requirement.

Next action: address/review the separately reported forced-password-change and pending-login-reservation findings before preparing staging acceptance authorization. BA-02 remains awaiting acceptance; BA-03 inactive.

## Remaining review corrections — 2026-10-17

User explicitly requested fixes for unchanged temporary passwords and erased pending login reservations, with focused database-free tests and tracker updates. Authorization covers those source corrections and necessary offline migration artifacts only; no installation, database connection/write, deployment or BA-03. Preserve existing staged logout change and other documentation/test edits.

Intended behavior: unchanged current/new passwords return 400 without credential/session changes. Account throttle rows retain at most five random UUID reservation IDs for the current 15-minute window. Success clears completed failures but preserves other pending IDs; failure removes only its own pending ID while keeping its attempt charged. Settlement is idempotent by ID, ignores expired/replaced windows, and runs on hashing errors and rejected login completion too. Worker-crash reservations expire with their existing window. An offline forward migration adds only this bounded field/constraints; no prior migration is rewritten or applied. Source corrections complete, awaiting runtime acceptance.

Evidence on 2026-10-17: the two new trigger regressions failed against pre-fix source (unchanged password unexpectedly accepted; pending counter missing after success) and passed after correction. API TypeScript compilation and all 30 BA-02 tests passed, including 18 serialized application checks, 6 HTTP/configuration checks, 4 credential/bootstrap checks and 2 operator boundary checks. New cases cover unchanged credentials for both roles, preserved restricted sessions, valid password-change rotation, mixed concurrent login success/failure enforcing five reservations, hashing errors, final-login rejection/rollback, expired-window completion and lost commit acknowledgement. Fresh read-only investigation and candidate review found no concrete surviving bypass/regression. These are application doubles/HTTP service stubs plus real local crypto checks, not PostgreSQL worker/runtime evidence.

Generated/reviewed offline `0002_login_reservations.sql`, snapshot and journal: only `access_limits.pending_ids` and its constraints are added. Snapshot chain/three-file migration parsing passed; all other tables and previous columns are unchanged. Existing migration files were preserved, not rewritten/applied. No database connection/write, installation, deployment or BA-03 activation. Existing staged logout fix and earlier edits remain preserved. Node 24.18.1/pnpm 9.15.0 remain different from pinned versions; pinned-runtime/target-host hashing and database/browser acceptance are still pending.

Current handoff: all three reported review findings are corrected in source with focused evidence; BA-02 remains awaiting acceptance and BA-03 inactive. Next action is review of the proposed staging acceptance plan/authorization below, including both pending BA-02 migrations and actual multi-worker/restart/cleanup/failure behavior. No staging execution is authorized by this correction.

## BA-02 staging execution authorization — 2026-10-17

User explicitly approved BA-02-V01–V09 in the dated plan below and confirmed the currently configured staging database has no real business data or other active users/test runs. Authorization recorded before harness preparation or database access. Solo assignment: prepare/review a separately opt-in harness offline, then read-only preflight; stop without writes if the exact six-empty-application-table, one-migration baseline or isolation requirements differ.

Only the plan’s migration rehearsal/application/rerun, synthetic hidden-terminal bootstrap/recovery, database-backed API checks, bounded workers, test-owned failure fixtures and ownership-checked cleanup are authorized. Maximum three concurrent connections. Preserve existing work and BA-01 evidence; record sanitized results. No installation, infrastructure deployment/provisioning, TLS trust changes, trusted-browser acceptance or BA-03 activation. BA-02 remains awaiting acceptance even if backend checks pass. This supersedes earlier database-execution prohibitions only within this plan.

| Active verification | Status | Evidence / next gate |
| --- | --- | --- |
| BA-02-V01–V09 | deferred remainder after user acceptance | V02 and scoped V09 passed; V01/V03/V06 partial; V04/V05/V07/V08 staging pending. See five-minute verification result. |

## BA-02 staging execution result — 2026-10-17

Stopped at the read-only isolation gate; BA-02 remains **awaiting acceptance**, BA-03 inactive. [Sanitized evidence](../../../apps/api/tests/evidence/ba02-staging.json) identifies HEAD plus SHA-256 fingerprints of the actual source/migration/test candidate. BA-01 evidence and existing staged/unstaged product changes were preserved.

Prepared and reviewed the separately opt-in [read-only harness entry gate](../../../apps/api/tests/ba02-staging-acceptance.mjs) offline. It refuses missing opt-in and unsupported modes before loading configuration/driver, uses two pools capped at one connection each, enforces read-only transactions and closes clients/pools on failure. Syntax, opt-out rejection and scoped TypeScript compilation passed. The remaining write/worker/ownership-ledger harness stages were not implemented or exercised because entry failed; this file is not a complete V01–V09 runner and is outside automatic test commands.

The sandbox DNS attempt failed before connection; the explicitly permitted network retry reached PostgreSQL 17.11. Runtime/migration connections resolved to the same target. Exact six application tables were empty; the sole migration hash/timestamp matched delivered `0000`; no non-extension public functions or user triggers were present. However, `pg_stat_activity` reported **five other database client sessions**, excluding both harness connections. Their purpose/activity was not classified and no session was terminated. Safe exclusive acceptance isolation could not be established, so no migrations, bootstrap, recovery, workers, failure fixtures or cleanup ran. BA-02-V01–V09 are all `not run`, rather than passed by analogy. Both harness pools closed with zero remaining connections.

Observed Node 24.18.1/pnpm 9.15.0 differ from pinned 24.21.0/12.11.2; no installation occurred. Existing configured TLS verification exception (`rejectUnauthorized=false`) was preserved and disclosed, not represented as trusted TLS. Only process executable names were inspected locally; that does not establish absence of API/watch processes. Database isolation failed independently. No product behavior, migration artifacts, database state or BA-01 evidence changed.

Next action: identify and quiesce the other staging client sessions through their owners, then obtain explicit authorization to rerun the read-only gate after isolation is confirmed. Do not terminate sessions or automatically retry into writes. A future passing gate still requires offline preparation/review of the remaining write harness before dependent execution. Preserve existing dirty candidate and re-fingerprint on any subsequent run; browser/target-host/pinned-runtime acceptance remains pending.

### Read-only session diagnosis — 2026-10-17

User clarified that the API is not running and explicitly authorized the proposed read-only session metadata inspection (“let’s do this”). Used a separate opt-in [inspection script](../../../apps/api/tests/ba02-session-inspection.mjs); syntax check passed. Sandbox DNS failed, then the permitted network retry succeeded. [Sanitized metadata evidence](../../../apps/api/tests/evidence/ba02-session-inspection.json) preserves the original preflight evidence separately.

At 13:15 Asia/Karachi, five other client sessions were visible, all `idle`, all under roles different from the harness, with no open transaction, assigned transaction ID or held snapshot. Named applications: `PostgREST 14.18`, `postgres_exporter`, `Supavisor (auth_query)`; two application names were blank. Named applications suggest provider services, but metadata names alone do not establish ownership or future inactivity. The two unnamed sessions remain unattributed. This snapshot does not prove a running API or exclusive isolation; the previous blanket zero-other-session gate is conservative, not evidence that every connection is an active test/user.

One inspection connection maximum; closed afterward. No query text, database-role names, credentials or network addresses retained; no termination, product/database changes or acceptance writes. Existing TLS exception preserved. V01–V09 remain not run and BA-02 awaiting acceptance. Next action: identify the two unnamed session owners and confirm which named sessions are provider-managed; then review a narrowly justified isolation-gate revision before another preflight. Do not silently exempt idle sessions or infer they cannot write later.

## BA-02 migrated-state continuation — 2026-10-17

User reports manually running `db:migrate` and seeing ten tables; supplied three history hashes match the checkout’s migration files. User then explicitly instructed autonomous continuation (“okay let’s go then, let me know where my attention is required”) after being told the plan must be reconciled with the migrated state. This authorizes read-only migrated-state inspection and preparation/review of the remaining already-approved backend checks, followed by their bounded execution if isolation/current-state gates hold. It does not authorize resetting/recreating the six-table baseline or silently attributing unexpected data. Original pre-application rollback/application observations remain not run; verify current schema/history and runner idempotency separately. Preserve earlier evidence as historical.

Revised entry: require exactly ten empty application tables, all three matching migration hashes/timestamps, expected access columns/constraints, no unexpected public test artifacts, and safe isolation. Inspect other client metadata without query text/credentials; provider names alone cannot exempt unidentified activity. Stop writes on unexpected data, unexplained application/transaction activity or unestablished isolation. Keep at most three harness connections, existing TLS settings and all original ownership/cleanup/scope limits. BA-02 remains awaiting acceptance. Solo assignment under spec-driven-delivery: migrated read-only gate, offline harness and bounded backend verification; no installation, deployment, TLS trust changes or BA-03.

### Revised session gate and migrated-state observations — 2026-10-17

Fresh read-only inspection confirmed ten empty application tables, three exact migration hash/timestamp matches, the non-null default-empty `pending_ids` column and its two bounded/source constraints, and no unexpected public triggers/functions. Separate metadata diagnosis identified previously unnamed roles as `supabase_admin` and `pgbouncer`. A further idle `Supavisor` connection used the harness/application role, consistent with retained pooler backend state after clients close. Names are evidence of reported metadata, not independent proof of provider ownership.

User explicitly confirmed dev is stopped and other database clients (including SQL Editor) are inactive. With that confirmation, revise the blanket zero-other-client requirement: allow only idle `supabase_admin`, `authenticator` and `pgbouncer` role connections, or idle same-role `Supavisor` connections, all without an open/assigned transaction, held snapshot or lock on the ten application tables. Unknown/active connections still stop writes. Recheck immediately before fixtures. Do not terminate sessions or claim ongoing exclusive isolation from one snapshot. Maximum three means harness-owned connections; provider background connections are observed separately. User attention is needed if another application/client is started during this run.

## BA-02 staging acceptance plan — 2026-10-17

Status: historical approved verification plan; subsequent scoped execution and user acceptance below supersede its completion gate. The original planning-only status and prompt below are historical. BA-02 remains awaiting acceptance and BA-03 inactive. This section owns the proposed staging verification scope; it does not replace the specification or historical BA-01 evidence.

### Outcome and boundaries

Establish AA-AC01–04 backend persistence/HTTP behavior against the one existing staging PostgreSQL target, including the three source-review regressions. Use real Nest/Fastify request injection with actual Authentication/Business services and PostgreSQL adapters, rather than the existing HTTP service stubs. No listener, public endpoint, TLS proxy, frontend or infrastructure deployment is necessary. Injected HTTPS/proxy headers test server policy only; they do not establish a trusted browser connection.

The current 30 passing BA-02 checks remain source/crypto/injection evidence. Staging acceptance needs a new, separately opt-in manual harness; proposed path `apps/api/tests/ba02-staging-acceptance.mjs` is not implemented by this planning assignment. Keep it outside automatic tests. Do not run/reuse the BA-01 staging harness: it assumes six tables and uses broad TRUNCATE cleanup. Reuse safe existing terminal/test utilities only after inspecting their contracts.

Phase P0 acceptance work is the minimum needed to verify already-approved BA-02 behavior. It introduces no product features, dependency, generic test framework, permission engine, deployment or BA-03 work. Test-harness clock/hash gates and SQL fixtures are isolated test controls; production cryptography, expiry, CSRF and throttling stay enabled and unchanged.

### Entry gate before any writes

After explicit execution authorization, first prepare/review the harness offline with existing tooling. Require an explicit opt-in such as `BA02_ACCEPT_STAGING=YES`; normal source-test commands must never read staging settings or connect. Record checkout revision plus a digest of relevant dirty source/migration files so evidence identifies the actual candidate, not HEAD alone. Preserve the existing staged logout fix, source corrections, migration artifacts and documentation; no index/branch/commit/push changes.

The historical baseline is **not freshly verified**: BA-01 left six empty application tables and one `0000` migration-history entry on 2026-10-12. Before starting, the approving user must confirm that the currently configured target is the dedicated staging database with no real business data or other users/test runs. No disposable/local database is assumed or provisioned.

Run a read-only preflight against only that explicitly confirmed target. Verify runtime/migration connections resolve to the same approved database; verify existing history hash against delivered `0000_business_bootstrap.sql`, exact six application tables and empty rows, and no unexpected test triggers/functions. Do not inspect or alter unrelated provider schemas. An unexpected table/history entry, nonempty application table, changed target or concurrent activity is a stop condition: report sanitized mismatch, perform no migrations/bootstrap/cleanup and obtain a revised plan. Do not silently classify records as test data or invoke BA-01 resume mode. A later interrupted run requires its own explicit resume authorization and matching ownership ledger.

Use existing validated database/TLS configuration without weakening it. Preserve and disclose the known explicit staging TLS-verification exception if still present; never present it as trusted TLS. Record server version, selected toolchain and connection-mode/budget evidence or unknowns. Use at most three concurrently open connections: a control connection plus two independent worker connections (one each); close workers before the migrator/recovery CLI. No unrelated API/watch process or unrelated cleanup timer may touch the target during acceptance. Keep harness-owned automatic cleanup quiescent except for the controlled V05 timer pass, using test composition/lifecycle control rather than a production bypass. Do not change provider settings or terminate provider/other-user sessions. If safe isolation or this connection budget cannot be established, stop the dependent checks.

Use the pinned toolchain if already available without installation. Otherwise report observed Node/pnpm versions and retain the clean pinned-toolchain/experimental-Argon2 release gate; do not install, switch dependencies or mislabel staging results as pinned-runtime acceptance.

### Proposed checks and evidence

All rows below are pending; IDs name verification tasks, not new implementation phases.

| ID / criterion | Concrete procedure | Required observation |
| --- | --- | --- |
| BA-02-V01 — migration safety | On the verified six-table baseline, rehearse `0001` then `0002` in one real transaction; optionally seed a synthetic counter between them to check default-empty pending IDs preserve attempt count. Inject a controlled SQL error and roll back. Then run the delivered migrator once and rerun it, without concurrent workers. | Rehearsal leaves original six empty tables and original history intact. Actual runner yields ten application tables, `pending_ids`/constraints and exactly three matching history entries; rerun adds none. No prior migration edited. This proves limited additive-DDL rollback, not backup/restore or destructive-migration recovery. |
| BA-02-V02 — AA-AC01 initial/lifecycle | Use the actual hidden-terminal setup command for one run-tagged synthetic business/branch/admin. Through real database-backed HTTP injection, log in, reject ordinary reads before required password change, reject unchanged replacement, then accept a different password. Create staff/another administrator; exercise list/edit/reset/disable/re-enable, fixed-role denial, invalid fields and duplicate username. | Safe status/body/cookies; unchanged password leaves credentials/restriction/sessions unchanged; valid change rotates authority; no privilege/foreign-ID input accepted; stored credentials are PHC hashes only and never returned/logged. No real restaurant records created. |
| BA-02-V03 — AA-AC02 login/CSRF | Wrong, unknown and disabled identities; missing/foreign/null Origin, wrong Host/protocol; mismatched/expired/reused pre-login proof; forged token and login with an existing session cookie. Inspect responses in memory, without retaining secrets. | Generic well-formed credential failures 401; origin/CSRF denial 403; fresh session token on login; consumed pre-login state cannot replay; cookie flags and no-store preserved; no raw session token in JSON/logs. This is server transport-policy evidence, not browser/TLS acceptance. |
| BA-02-V04 — AA-AC02 throttle persistence | Independently compose two worker processes with separate bounded pools and shared PostgreSQL. Verify five account attempts/15 minutes, 30 source requests/minute across accounts, source canonicalization, Retry-After, hash saturation and separate 10,000-row account/source capacity gates using run-owned synthetic rows. | Counters are shared/atomic; rejected traffic does not hash or extend windows. Pause/release test hash work to mix success and failure: success retains other pending IDs; excess attempts remain denied. Real-hash behavior is checked separately from the deterministic scheduling gates. |
| BA-02-V05 — AA-AC03 restart/expiry/cleanup | Restart only a harness-owned worker and verify its existing session/counter state persists. Stop a worker after an admitted reservation; verify reservation survives until its window expires. Set only run-owned timestamps to exercise exact idle/absolute/pre-login/window boundaries and stale completion; invoke real cleanup and observe a timer pass in isolation. | Restart never resets authority/counters. Expired state rejects before cleanup; stale settlement never changes a new window. One cleanup pass removes at most 100 eligible rows per state table, preserves unexpired rows, and successive passes can remove the remaining owned fixtures. No wait for 12 hours or runtime clock override in production is needed. |
| BA-02-V06 — AA-AC03 revocation | Use two independent cookie jars. Exercise logout, password change/reset, disable, role and explicit bound-branch grant changes, re-enable and session expiry. Reproduce active-session logout with unrelated pre-login CSRF, then valid logout and replay; repeat logout using allowed expired/revoked/absent-session proof. | Bad proof returns 403 without misleading cookie clearance; valid logout commits server revocation before 204/cookie clearance. Next authorization after required revocation fails, re-enable never resurrects a session, and other sessions revoke as specified. |
| BA-02-V07 — AA-AC01/03 real races | Across workers race two last-active-admin removals; coordinate a sensitive staff mutation with concurrent logout/disable/demotion and a valid login with concurrent credential change. Use explicit test barriers and bounded timeouts. | Never zero active administrators or partially updated account/grant/session state. Mutation authorizing after revocation commit is rejected; a mutation authorized/committed earlier may succeed. Login rechecks current credentials/status/grant before issue. Report observed ordering, not an assumed winning operation. |
| BA-02-V08 — AA-AC04 recovery/failure | Run actual local `recover-administrator` with the synthetic IDs and hidden terminal input. Inspect its attributable OS-identity event; reject wrong business/non-admin target. Cause a test-client connectivity failure (closed harness-owned pool) and an injected transaction failure/lock timeout on owned rows; do not stop PostgreSQL/provider networking. | Old credentials/sessions fail after recovery, replacement requires a different password before ordinary access. No HTTP recovery path. Login/protected work fail closed with sanitized errors, rollback preserves credential/grant/session state, reservations settle once or remain conservatively charged if persistence is unavailable. Restoring service never accepts stale authority. |
| BA-02-V09 — evidence and cleanup | Quiesce/close all test workers, timers and CLI pools; run ownership-checked cleanup, then read back schema/history/counts and verify no pool remains open. | Ten empty application tables and three migration entries retained; no synthetic business/admin/session/counter/event/pre-login data or test-only failure artifact remains. Failures and cleanup failures are recorded independently; no phase closure inferred. |

For capacity/expiry/failure fixtures, direct SQL may modify only the test-owned rows and schemas explicitly listed here after preflight. Prefer transaction-local rollback or a harness-side adapter failure over installing persistent database functions/triggers. Do not mutate source to introduce a production failure switch. A failure mode that cannot be exercised safely is `not run` with its reason and remaining criterion, not passed by analogy.

Do not create a second business installation or operational branch, switch installation binding or claim AA-AC05/BA-03 integrated isolation acceptance. Foreign UUIDs and malformed input may be used as negative BA-02 checks without foreign records. A same-business non-operational branch fixture would need separately scoped BA-03 authorization; it is not implicit in these checks.

### Ownership, cleanup and output

Generate unique synthetic IDs/run tag and an ownership ledger for every committed business/branch/account, session/pre-login digest, counter key, event ID and test-only artifact. Keep raw passwords/session/CSRF values only in protected transient process/terminal state; never put them in argv, evidence, ordinary logs or committed fixture files. A transient resume ledger, if necessary, is owner-readable and records ownership identifiers rather than credentials; do not retain it in the public evidence artifact.

Before a scenario seeds direct SQL rows, register their exact keys in the ledger. Cleanup first verifies that records to be removed still belong to this run. Delete in FK order within a transaction: sessions/pre-login/counters/events, grants/credentials/accounts, installation binding, branch, business. Use exact run-owned identifiers; **no TRUNCATE, schema drop, broad DELETE or clearing migration history**. Remove no unknown records. If anything cannot be attributed or the process is interrupted, stop destructive cleanup, report the remaining ownership state safely and require an explicit resume decision. Preserve migrations/history even on a failed acceptance run; never pretend rollback/cleanup succeeded.

Proposed sanitized evidence path: `apps/api/tests/evidence/ba02-staging.json` (not created now). Include candidate fingerprint, timestamps, observed runtime/server/TLS mode, per-V-ID/AC-ID procedure/result (`passed`, `failed`, `not run`), sanitized error category, preflight and cleanup observations, connection accounting and remaining limits. Do not include connection strings, host credentials, passwords, PHC hashes, raw cookies/tokens, real customer data or unredacted subprocess output. Preserve `ba01-staging.json` unchanged. Harness nonzero exit and tracker `awaiting acceptance` are required for any failed required check or incomplete cleanup; do not turn a cleanup failure into a clean pass.

### What this can and cannot accept

Successful execution establishes the recorded backend/database portions of AA-AC01–04 only. Browser/session-cookie delivery on trusted LAN HTTPS, local asset/offline browser behavior, certificate distribution/renewal, target-host hash/load suitability, clean pinned installation, host operator custody, log retention, backup/restore and pre-restore session invalidation remain separately scoped gates. A closed test pool is a scoped failure simulation, not a full database outage or disaster-recovery result. Two harness processes prove tested worker behavior, not arbitrary scale or production capacity.

Historical gate, superseded for development-phase closure by [BA-02 acceptance and deferred verification](#ba-02-acceptance--2026-10-17): trusted-browser and remaining essential runtime evidence remain required before operational release, rather than preventing the revised BA-02 development acceptance. Do not close BA-02, reopen accepted F-01 or activate BA-03 merely because backend staging checks pass. No real staging state was inspected during this planning assignment; earlier staging emptiness and reported tool versions remain historical observations.

### Concrete staging-acceptance authorization prompt

This is proposed text for the user to send. Its presence here authorizes nothing.

```text
Approve and execute BA-02-V01–V09 in the “BA-02 staging acceptance plan —
2026-10-17” section of docs/planning/business-access/phase-tracker.md.
Follow AGENTS.md and spec-driven-delivery. Record this authorization first.

I confirm the currently configured target used for BA-01 is the dedicated
staging PostgreSQL database, with no real business data or other active
users/test runs. This authorizes read-only preflight, then the listed
staging writes only if preflight confirms the exact six-empty-table,
one-migration baseline. Stop on any mismatch; do not reset or resume
unexpected state automatically.

Prepare/review the separately opt-in BA-02 acceptance harness offline
using existing tools before connecting. Preserve existing staged/unstaged
work and BA-01 evidence. Identify the actual dirty-source/migration
candidate in sanitized evidence. Do not reuse the destructive BA-01 harness.

Authorize the limited transactional migration rehearsal/rollback, actual
application and rerun of 0001/0002 via the delivered migrator, synthetic
application bootstrap and administrator recovery via hidden-terminal
commands, real database-backed Nest/Fastify injection, two bounded worker
processes, listed test-owned timestamp/capacity/failure fixtures, and
ownership-checked cleanup. Maximum three concurrent connections; no
unrelated API/watch process, mixed old/new workers, provider session
termination, broad deletion or schema/history reset.

Retain ten empty application tables and three migration entries after
successful cleanup. Save sanitized per-check results to
apps/api/tests/evidence/ba02-staging.json and update the tracker with
failures, skipped checks, cleanup state and evidence limits. If a new
product defect or broader repair is discovered, report it before changing
product behavior; do not silently weaken checks or expand scope.

No installation, infrastructure provisioning/deployment, TLS trust change,
frontend, trusted-browser acceptance, target-host benchmark, BA-03
activation or phase closure is authorized. Use the pinned toolchain if
already available; otherwise disclose the mismatch without installing.
Keep BA-02 awaiting acceptance even if these backend checks pass.
```

Planning verification: relevant migrator/operator/harness source and owning acceptance criteria reviewed; documentation whitespace/relative-link checks only. No new harness, tests, installs, database access, migration application or acceptance evidence produced.

### Five-minute verification resume — 2026-10-17

User explicitly instructed continuing and completing BA-02 verification within five minutes. This authorizes the previously requested exact ownership-checked cleanup of the six verified synthetic bootstrap records and fresh retry, preserving all schema/history. No BA-03 activation. Stop on new uncertain ownership or product defect; report unrun checks honestly at the deadline.

### Five-minute run progress — 2026-10-17

The user-authorized resumed cleanup revalidated the exact unique run tag and six linked synthetic records, removed only those IDs in FK order and preserved schema/history. Earlier interrupted-run evidence is retained in `apps/api/tests/evidence/ba02-bootstrap-interrupted.json`. The PTY helper now waits for child exit after terminal EOF instead of immediately treating a still-exiting child as timed out; fresh bootstrap acknowledgement succeeded. This is a harness correction, not a product behavior change. The existing 30 BA-02 source/crypto/HTTP-double/operator-boundary tests passed again on Node 24.18.1/pnpm 9.15.0. They do not replace database-worker/browser evidence. Fresh lifecycle run remains subject to final result and ownership-checked cleanup below.

### Five-minute verification result — 2026-10-17

[Scoped backend evidence](../../../apps/api/tests/evidence/ba02-backend.json) records actual PostgreSQL/Nest injection results and explicit per-V-ID coverage. **BA-02 remains awaiting acceptance; overall verification is incomplete.** No BA-03 activation or product source change.

- V02 passed: actual hidden-terminal synthetic setup; initial restriction and unchanged-password rejection without credential/session mutation; valid password rotation; staff/second-admin creation; list/edit/reset/disable/re-enable; role denial, invalid/foreign fields, duplicates and PHC-only storage.
- V03 partial: wrong/unknown/disabled credentials, Origin/Host/protocol rejection, CSRF mismatch/replay, forged session, cookie flags and no-store passed. Expired proof and existing-session login fixation remain unrun.
- V06 partial: password/reset/disable/re-enable revocation and active-session logout with unrelated pre-login proof, valid logout and replay passed. Role/grant changes and expired-session logout variants remain unrun.
- V01 partial: delivered `pnpm db:migrate` rerun succeeded. Final [read-only gate](../../../apps/api/tests/evidence/ba02-migrated-preflight.json) passed with ten empty tables, three matching hash/timestamp history rows and expected reservation column/constraints. Original rollback rehearsal/first application remains unobserved because the user applied migrations manually; no database reset was attempted.
- V09 passed for this run: exact ownership-checked cleanup, zero rows in all ten application tables, three migrations retained, no test triggers/functions, all harness pools closed. Prior interrupted-bootstrap records were separately cleaned under explicit resume authorization; historical evidence retained.
- V04/V05/V07/V08 staging scenarios remain not run: two-worker throttle/capacity/races, worker restart/crash/exact expiry/batched timer cleanup, actual recovery and database failure/rollback fixtures. Thirty existing offline checks passed but do not substitute for these scenarios. Five-minute timebox prevented preparation/execution of the remaining harness; no full-acceptance claim.

Harness-only PTY EOF/child-exit regression check passed offline. Runtime/pinned mismatch and existing TLS verification exception remain disclosed. A pg driver warning about concurrent queries on one cleanup client was observed; cleanup nevertheless completed and final readback independently passed. No installation, TLS changes, deployment, frontend/browser acceptance or migration artifact edits occurred in this run. BA-01 evidence preserved.

Current next action: prepare and review the remaining V04/V05/V07/V08 harness plus missing V03/V06 cases, then execute under existing bounded authorization with fresh state/isolation checks. No user action is currently needed unless another client is started, staging state changes or a defect/ownership uncertainty is discovered. Trusted-browser acceptance remains separately authorized work.

## BA-02 acceptance — 2026-10-17

**Decision: complete; accepted by the user.** After discussing passed evidence, unrun scenarios and P0/P1 scope, user explicitly instructed: “let’s update the BA-02 tracking and mark it as accepeted.” This instruction revises the development-phase exit scope and supersedes earlier instructions to keep BA-02 awaiting acceptance until all V01–V09 and trusted-browser checks are complete. Acceptance is the user’s decision with disclosed evidence limits, not a claim that missing checks passed. BA-02-T01/T02/T03 are complete under this revised scope; BA-03 remains inactive and requires separate authorization.

Accepted evidence: 30 existing automated checks; real PostgreSQL/Nest staff lifecycle V02; scoped login/CSRF/revocation/logout scenarios; matching migration hashes/schema and successful migrator rerun; ownership-checked cleanup with ten empty application tables, three migration entries and all harness pools closed. Canonical execution results remain [backend evidence](../../../apps/api/tests/evidence/ba02-backend.json) and [final read-only verification](../../../apps/api/tests/evidence/ba02-migrated-preflight.json). Historical evidence files remain unchanged; their incomplete-verification labels describe the run, not the later user acceptance decision.

### Deferred verification and release limits

| Follow-up | Priority / trigger | Existing evidence limit |
| --- | --- | --- |
| Multi-process throttle sharing, worker-crash reservations, mixed-result throttle races, capacity saturation and elaborate concurrent failure combinations (V04 / advanced V05/V07) | P1 for the current single-process development increment; verify before supporting multiple API processes or relevant capacity claims | Implemented design/source checks only; no two-real-worker staging result |
| Basic session/pre-login expiry, restart persistence, remaining login fixation and role/grant/expired-session revocation variants (remaining V03/V05/V06) | Essential operational validation before release; deferred from BA-02 closure, not reclassified as optional safeguards | Offline checks and partial database flows; exact database-backed scenarios unrun |
| Last-administrator concurrent-removal invariant (focused V07), actual administrator-recovery CLI and database failure/rollback behavior (V08) | Essential operational validation before release | Source/double/operator-boundary evidence; actual staging race/recovery/failure procedures unrun |
| Original additive migration rollback rehearsal / observed first application (V01) | Deferred migration-safety evidence before release; do not reset staging to recreate the old baseline | User applied migrations manually; hashes/schema/rerun verified, rollback rehearsal not run |
| Browser cookie delivery and trusted client HTTPS | Not applicable to current API-only BA-02 acceptance; assess only if a browser client/HTTPS deployment is separately scoped | No browser client or production HTTPS setup exists in the current project |
| Clean pinned runtime, target-host hashing and configured database TLS verification exception | Separate runtime/deployment follow-ups when relevant work is authorized | Pinned Node/pnpm and host suitability unverified; existing database TLS exception disclosed |

No deployment, production readiness, multi-instance acceptance or broader business-module acceptance is implied. Existing security behavior and requirements remain implemented; this decision changes verification timing and development-phase acceptance only. No further V01–V09 execution is scheduled by this closeout. Current next action: user selects/authorizes the next phase; retain the release-gate follow-ups above for that planning. BA-01/F-01 evidence and all existing staged/unstaged work preserved; no index/commit/push operations.

### API-only scope clarification — 2026-10-17

User explicitly clarified: there is currently only an API, with no browser client or production HTTPS setup. Browser/trusted-client HTTPS acceptance is **not applicable to the current BA-02 scope**, not a missing current deliverable or acceptance blocker. Earlier browser release-gate wording is superseded by this clarification. Existing origin/protocol/CSRF/cookie code remains as implemented and server-policy injection evidence; no infrastructure or client existence is implied. Future browser/client deployment needs its own scoped requirements. BA-02 remains complete and accepted; BA-03 inactive. Backend checks recorded as unrun remain unrun; this clarification does not change their evidence.

### Git closeout authorization — 2026-10-17

User requested committing this branch and its changes, merging into `main`, then continuing development from the integrated baseline. This supersedes the historical no-index/commit/branch-operation restriction for this closeout only. All pending files were reviewed as BA-02 source corrections, additive migration, opt-in harness/evidence and acceptance documentation. Fetched origin refs; local `main` matches `origin/main` at `a725fd3` and is an ancestor of `codex/vendor-isolation`. Preserve the existing branch commits; commit the reviewed pending files, then fast-forward local `main`. No remote push is included in this local integration. No next-phase execution is authorized by the merge.

Verification reused the 30 passing BA-02 checks and scoped staging results above; final whitespace, manual-harness syntax and evidence JSON/secret-payload checks passed. BA-01 evidence is unchanged. Handoff after integration: `main` is the accepted BA-01/BA-02 development baseline; user selects/authorizes the next phase, with remaining verification limits above retained. The skill requires phase scope/evidence/closeout, not implementation directly on `main`; a new focused branch from integrated `main` is the recommended next implementation workflow.
