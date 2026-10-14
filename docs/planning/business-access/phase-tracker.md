# Business/Branch and Authentication/Access — Joint phase tracker

Parent: [global tracker](../TRACKER.md). Owner: primary agent; BA-02 assignments in [collaboration record](../../../apps/api/src/modules/authentication/docs/features/access/agent-collaboration.md).
Specifications: [Business/Branch](../../../apps/api/src/modules/business/docs/features/foundation/spec.md), [Authentication/Access](../../../apps/api/src/modules/authentication/docs/features/access/spec.md).
Status: BA-01 complete, accepted on 2026-10-12 under user-authorized staging acceptance. BA-02 source complete, awaiting acceptance; no active execution authorization beyond source checks. BA-03 remains proposed.

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

Deliver lifecycle, versioned authentication/staff/context HTTP interfaces, sessions/CSRF/throttling, access enforcement, local recovery, reviewed offline migrations and focused database-free checks. No installation, database connection/write, migration application, provisioning/deployment, TLS trust changes, frontend, Swagger or BA-03. Existing BA-01 staging authorization does not extend to BA-02. Missing necessary dependencies require scoped approval; independent work continues. Source completion remains awaiting acceptance.

| Active P0 task | Status | Acceptance / expected evidence |
| --- | --- | --- |
| BA-02-T01 | awaiting acceptance; source complete | AA-AC01; lifecycle/last-admin/credentials and bootstrap regressions, offline migrations |
| BA-02-T02 | awaiting acceptance; source complete | AA-AC02/03; injection/clock/CSRF/throttle/session checks; database/browser evidence deferred |
| BA-02-T03 | awaiting acceptance; source complete | AA-AC01/03/04; action/branch denial, transactional recheck and local recovery boundary |

Completion shape: source HTTP API and operator command with focused offline evidence. Not accepted persistence, trusted browser or deployment readiness. Assignment and shared-file ownership: [collaboration record](../../../apps/api/src/modules/authentication/docs/features/access/agent-collaboration.md). Preserve the three pre-existing planning-document edits; no Git index/branch/commit/push changes.

## Phase and task IDs

BA-00 planning and BA-01 acceptance are complete; BA-02 source is complete and awaiting required runtime acceptance under the limits above. Later rows are proposed sequencing and scope handles for review; approving a specification is separate from authorizing a row. Database execution/installation permissions must be explicit when an implementation phase needs them.

| Phase | Proposed P0 tasks / outcome | Status | Exit criteria / evidence |
| --- | --- | --- | --- |
| BA-00 | BA-00-T01 record topology; BA-00-T02 draft linked specifications; BA-00-T03 reconcile tracking/review decisions | complete | Topology approval recorded; both specs and proposed task/acceptance links prepared; documentation checks only |
| BA-01 | BA-01-T01 Business/Branch schema and validated binding; BA-01-T02 atomic operator bootstrap including first administrator | complete | [BB-AC01](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac01--explicit-ownership-and-configuration), [BB-AC02](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac02--atomic-and-repeatable-provisioning); reviewed first migration and focused authorized runtime evidence |
| BA-02 | BA-02-T01 staff lifecycle/credential policy; BA-02-T02 local login, sessions and revocation; BA-02-T03 branch/action enforcement and controlled recovery | awaiting acceptance | [AA-AC01](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac01--staff-lifecycle-and-permissions), [AA-AC02](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac02--login-and-browser-session), [AA-AC03](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac03--revocation-and-concurrency), [AA-AC04](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac04--local-recovery-and-denial-on-failure) |
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
- Next action: implementation review of this source/diff, then separately authorize a scoped BA-02 database acceptance plan before any execution. Include second migration, lifecycle/recovery, real races, worker/restart counters, cleanup and outage behavior; trusted-HTTPS browser acceptance and target-host hashing require their own operational prerequisites. Do not activate BA-03 or close BA-02 on source-only evidence.

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
