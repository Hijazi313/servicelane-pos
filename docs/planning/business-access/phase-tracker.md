# Business/Branch and Authentication/Access — Joint phase tracker

Parent: [global tracker](../TRACKER.md). Owner: primary agent, solo documentation assignment.
Specifications: [Business/Branch](../../../apps/api/src/modules/business/docs/features/foundation/spec.md), [Authentication/Access](../../../apps/api/src/modules/authentication/docs/features/access/spec.md).
Status: BA-01 complete, accepted on 2026-10-12 under user-authorized staging acceptance. Active implementation phase: none; BA-02/BA-03 remain proposed.

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

## Phase and task IDs

BA-00 planning is complete and BA-01 implementation is authorized as recorded above. Later rows are proposed sequencing and scope handles for review; approving a specification is separate from authorizing a row. Database execution/installation permissions must be explicit when an implementation phase needs them.

| Phase | Proposed P0 tasks / outcome | Status | Exit criteria / evidence |
| --- | --- | --- | --- |
| BA-00 | BA-00-T01 record topology; BA-00-T02 draft linked specifications; BA-00-T03 reconcile tracking/review decisions | complete | Topology approval recorded; both specs and proposed task/acceptance links prepared; documentation checks only |
| BA-01 | BA-01-T01 Business/Branch schema and validated binding; BA-01-T02 atomic operator bootstrap including first administrator | complete | [BB-AC01](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac01--explicit-ownership-and-configuration), [BB-AC02](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac02--atomic-and-repeatable-provisioning); reviewed first migration and focused authorized runtime evidence |
| BA-02 | BA-02-T01 staff lifecycle/credential policy; BA-02-T02 local login, sessions and revocation; BA-02-T03 branch/action enforcement and controlled recovery | proposed | [AA-AC01](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac01--staff-lifecycle-and-permissions), [AA-AC02](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac02--login-and-browser-session), [AA-AC03](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac03--revocation-and-concurrency), [AA-AC04](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac04--local-recovery-and-denial-on-failure) |
| BA-03 | BA-03-T01 integrated context and two-installation access acceptance | proposed | [BB-AC03](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac03--independent-installations), [BB-AC04](../../../apps/api/src/modules/business/docs/features/foundation/spec.md#bb-ac04--fail-closed-on-invalid-context), [AA-AC05](../../../apps/api/src/modules/authentication/docs/features/access/spec.md#aa-ac05--business-and-branch-isolation), plus accepted BA-01/BA-02 |

BA-01 needs approved shared provisioning/transaction and credential contracts from both specs; it implements only the administrator bootstrap slice of Authentication. BA-02 builds remaining lifecycle and HTTP access on that boundary. BA-03 must pass before Menu implementation is proposed. Detail implementation checklists only upon specific phase activation; no later business module is activated by this pack.

## Review decisions

BA-D01, BA-D02 and BA-D05 are approved by explicit user instruction on 2026-10-12; implementation is limited to BA-01. BA-D03, BA-D04 detailed controls and BA-D06 remain open. Recovery, later staff lifecycle and HTTP permissions are not activated by approving their direction.

| ID | Proposed choice / question | Impact and review boundary |
| --- | --- | --- |
| BA-D01 | Operator-command initial provisioning; one cross-module transaction; local privileged command for administrator recovery | Approve bootstrap/recovery responsibility and transaction ownership before BA-01. Host operator identity/custody requires a runbook before deployment. |
| BA-D02 | Local normalized username/password, administrator/staff roles, explicit initial branch grant and forced initial/reset password change | Approve role matrix and credential policy before implementing account schema/credentials in BA-01/BA-02. No shared PIN or cloud identity dependency. |
| BA-D03 | Opaque server-side sessions in same-origin protected cookies; 30-minute idle/12-hour absolute expiry; agreed throttling and CSRF | Approve session approach before BA-02. Proposed throttle starting point: account key allows five failed attempts per 15 minutes before temporary delay, source address allows 30 per minute; all workers share local PostgreSQL state, expired counters are cleaned, no permanent lockout. Validate this proposal against shared restaurant devices and target-host load; these values are not industry mandates. |
| BA-D04 | Trusted LAN HTTPS and local same-origin client serving | Approved topology needs these operational controls, but no hosting/packaging/front-end implementation belongs here. Select certificate trust/distribution, hostname and client hosting before browser/deployment acceptance. |
| BA-D05 | Validated business/branch configuration and installation binding; no editor in first increment | Approve initial fields/validation and controlled setup before BA-01. Operator/backup custodian, host/power ownership and downtime/data-loss targets remain open before deployment. |
| BA-D06 | Clarify requested release versioning versus HTTP API versioning; decide first business API prefix and OpenAPI scope | No versioning solution is approved. Decide prefix before BA-02 routes are implemented. Swagger/OpenAPI remains a candidate, not silently added P0. Release/build identification must be scoped before rollout. |

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

- BA-01 closed; no active implementation phase. BA-D01/BA-D02/BA-D05 approved; BA-D03, detailed BA-D04 controls and BA-D06 remain open. BA-02/BA-03 inactive.
- Staging now has the first migration applied with six empty application tables; no configured restaurant or administrator remains after synthetic-data cleanup. Provider schemas and the Odoo reference were untouched.
- Latest edits: terminal cleanup fix and regression; manual staging harness/terminal driver/sanitized evidence; acceptance/scope/module/migration/operator/global tracker documentation. Existing work, including the concurrently updated root AGENTS.md context-reuse rule, was preserved. User authorized local commits on 2026-10-12; workflow guidance and BA-01 delivery are grouped separately. No installs, infrastructure provisioning, deployment or push.
- One next action: planning/review for BA-02 from this tracker—resolve BA-D03 session/throttling/CSRF, BA-D04 origin/HTTPS acceptance boundary and BA-D06 versioning/documentation scope; review authentication service placement/hash-adapter risk. Do not implement BA-02 until exact decisions/tasks are authorized.

## Verification follow-up — 2026-10-12

User requested verification and an easy-to-understand handoff. Refreshed staged checkout, scope and module/tracker guidance. Recompiled API to ignored `dist/ba01-check` and reran the 11 focused Node tests: all passed. Diff whitespace check passed. User clarified that only staging exists, with no disposable target; no connection, migration application or provisioning execution was attempted; database-backed acceptance remains pending. No later phase activated.

Plain-language handoff: Business describes the restaurant and its initial location, validates settings and explicitly binds the installation to that business/branch. Authentication currently supplies only the first administrator record, salted password hash and branch grant; it does not yet let staff log in or enforce sessions/permissions. The operator command coordinates both in one transaction; the SQL migration describes their six database tables. Specifications define intended behavior, module READMEs index supported capabilities, tests record focused checks, and this tracker owns authorization/evidence/pending acceptance. The next usable outcome is verified restaurant setup, not a working POS or login screen.

## Staging acceptance authorization — 2026-10-12

User confirmed staging is empty with nothing to preserve, explicitly authorized BA-01 testing there and requested closure if all criteria pass. This supersedes the earlier database-write restriction for BA-01 acceptance on the configured staging database only: migration application/rerun, synthetic provisioning records, concurrent attempts, controlled rollback/failure and cleanup of test-owned artifacts/data. No provider/production/Odoo changes or BA-02/BA-03 activation. Existing staged work remains preserved.
