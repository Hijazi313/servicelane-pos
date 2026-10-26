# Billing/Payments — phase tracker

Parent: [global tracker](../../../../../../../../docs/planning/TRACKER.md). Plan: [README](../../README.md). Specification: [spec](spec.md). Decisions: [decisions](decisions.md).

Status: revised BP-00 design accepted; BP-01 source/offline delivery implemented; awaiting user review. BP-02 procedure preparation complete; execution inactive. Coordinator: primary agent; [read-only reviews](agent-collaboration.md).

## Planning authorization — 2026-10-25

User requested the smallest justified Billing/Payments backend plan from the global tracker, verification of checkout/integration, preserved accepted Orders/Kitchen scope/evidence/ledgers/incident reviews, existing documentation structure, suitable topic branch and focused local commits. Authorized: planning/documentation and local Git checkpoints only. No implementation, database access, tests, installation, publication, deployment or later-phase activation.

Assignment: this checkout `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, `codex/billing-planning`, from `main` `d75ac92e2dc4e5e45dafa600ec8e4467e0cb9f98`; documentation owner only. Reuse checkout: tracked clean at entry, no overlapping staged work, seven untracked ownership ledgers preserved/excluded. No worktree needed.

## Entry evidence — 2026-10-25

- Local entry HEAD, main, cached origin/main and network-enabled live `git ls-remote origin refs/heads/main` agree at `d75ac92`; GitHub connector confirms [PR #16](https://github.com/Hijazi313/servicelane-pos/pull/16) merged with that exact merge SHA. Initial sandboxed remote-ref check failed DNS; the authorized network-enabled read succeeded without changing refs. PR metadata verifies Kitchen integration, not a new CI/runtime run.
- Orders remains accepted/closed; Kitchen remains accepted/merged with its recorded composed evidence and operational deferrals. Source inspection confirms Orders exports only its module/preparation provider; Billing needs a separately approved financial projection, not a preparation payload expansion or foreign persistence access.
- Seven untracked ledgers and all tracked reports unchanged; no environments, database, harnesses or accepted checks accessed/executed. Existing evidence remains at its original source hashes.
- No Billing capability implemented or accepted. No tax applicability/rate or receipt obligation verified by this planning task.

## Tasks and phase gates

| Task / phase | Status | Exit / expected evidence |
| --- | --- | --- |
| Planning: verify entry and define smallest candidate | Complete | Entry inspection above; [BP-R01–06 and BP-A01–18](spec.md#acceptance-criteria), boundaries and decision recommendations documented |
| BP-00: resolve scope/business decisions and concrete contracts | Accepted by user 2026-10-26 | Revised multiple-rule/seven-route design accepted; source authorization recorded below |
| BP-01: approved source/offline delivery | Implemented; awaiting user review | Offline evidence below; persistence criteria remain BP-02 gaps; no user acceptance inferred |
| BP-02: bounded persistence verification | Procedure preparation complete; execution inactive | Later reviewed target-specific procedure and renewed disposable/exclusive reservation; concurrency/rollback/fresh-process/owned cleanup evidence; separate user acceptance |

## Current handoff

BP-01 isolated source/offline delivery is implemented for the seven accepted routes and BP-A01–18 source scope. [Authorization and isolation](#bp-01-authorization-and-source-isolation--2026-10-26) precedes source edits. [Offline evidence and limits](#bp-01-delivery-evidence--2026-10-26) records what was executed and what remains unverified. BillingModule is absent from AppModule; no new route is live. Samples remain offline fixtures; no installed policy defaults. No upstream accepted suites/harnesses were rerun.

Next action: review the [BP-02 procedure](database-acceptance.md). Preparation-only authorization is recorded below; procedure and offline planning helper are delivered, not a runnable PostgreSQL harness. If automated execution is selected, concrete execution tooling must be prepared/reviewed within the existing preparation scope before requesting one-run authorization. The procedure defines exact target/reservation/migration/execution permission; no environment/database access is currently authorized. BP-01 user acceptance remains separate.

Seven untracked ledgers, accepted Orders/Kitchen contracts/reports and pending incident reviews are preserved. Incidents: none in BP-01; 21 existing incident entries remain pending user review, without closure or prevention-policy change.

## Settings definition — 2026-10-26

Historical settings checkpoint; the subsequent contract-planning result below supersedes its next-action wording.

User authorized defining the exact recommended settings/defaults. Completed documentation: typed tax policy, no assumed fiscal values, explicit calculation/rounding rules, existing Business display settings, administrator authorization, revision/history, settlement snapshots and BP-A08–10. Actual tax rules and synthetic-only runtime mode remain undecided; implementation inactive. Source-scope additions and ownership refinement are recorded in BP-D07.

Completion shape: reviewable settings specification, not runnable configuration. Next: complete BP-00 concrete contracts and confirm fiscal development mode before source entry. Only documentation links/diff/whitespace reviewed; no tests, build, environment/database access, installation or publication. Accepted Orders/Kitchen evidence, seven ledgers and incident reviews preserved. Incidents: none this task; existing 21 pending reviews unchanged.

## BP-00 contract-planning authorization and result — 2026-10-26

Historical singleton-contract checkpoint; the bounded revision below supersedes its mode request and calculation shapes.

User explicitly authorized completion of Billing contract documentation with three independent read-only sub-agents, primary-only writes/Git, and local focused commits. Verified checkout `codex/billing-planning` at `e936bdc`, tracked clean, only the seven preserved untracked ledgers; existing integration base remains `d75ac92`. No rebase/merge/fetch/source action required or inferred. [Assignments](agent-collaboration.md) record shared-checkout ownership and restrictions.

| Review / evidence | Result and reconciliation |
| --- | --- |
| Settings/Business independent source review | No blocking contradiction after note-as-audit and tuple-wide display revision clarified; new Business operations/history/provider exports remain prerequisites |
| HTTP/shared wiring independent source review | No blocking contradiction after POST assessment selected using actual runAuthorized CSRF/session semantics; seven strict methods, views, error/size/recovery contracts defined |
| Money/retry/concurrency independent source review | No blocking contradiction; replay ordering, reset-policy precedence, coherent assessment ordering and singular cash aggregate/uniqueness clarified |
| Primary REST design checklist/diff/local-link/whitespace review | Design covers applicable checklist; no collection/pagination. Static document checks only; executed DTO/HTTP/type/serialization/DB evidence absent |

All required independent contract planning is delivered; remaining material gate is the one owner fiscal-mode decision above plus acceptance/source authorization. BP-01/BP-02 remain inactive. No test/build, dependency/runtime installation, environment/database access, migration, publication or deployment. No upstream scope reopened. Temporary runtime artifacts: none. Incidents: none in this work; 21 existing pending reviews preserved, no closure/prevention-policy change.

## Bounded multiple-rule revision — 2026-10-26

User explicitly approved using sample development values, then authorized the bounded BP-00 deviation for multiple taxes and service/seating charges. Entry `5b0f57e`, same `codex/billing-planning` checkout, tracked clean with only seven preserved ledgers. Scope remains planning/documentation/local commits, not implementation/tests. No new branch/worktree or integration action required.

Completed: explicit configured/unconfigured policy and currency binding; finite charge/tax schemas/defaults; selective tax bases; inclusive extraction/remainder allocation; automatic/optional per-order selection; updated DTO/public views/error/capacity/retry contracts and BP-A15–18; removed service charges from phase P1. Three read-only reviewer continuations advised settings/selection, HTTP/capacity/replay and exact money, then reviewed the revised specification without remaining blocking design issues after three-way currency matching, retired-rule identity and selector-summary clarifications. Only the primary writes/Git. Sample approval resolves the former development-mode blocker; no actual Pakistani fiscal values are inferred. Prior singleton review does not prove revised runtime correctness.

Verification: primary documentation/REST design checklist, stale-term/local-link/whitespace review only; no executed math/type/HTTP/runtime/DB checks. New breakdown arrays remain subject to existing full 2 MiB admission, expanded policy to 16 KiB edit/response admission. Current contract review/acceptance and source permission remain next; BP-01/BP-02 inactive. No changes to application, dependency/skill files, upstream evidence or ledgers. Incidents: none this task; 21 existing pending reviews preserved.

## Branch publication — 2026-10-26

User explicitly requested pushing this branch to GitHub. Committed scope reviewed: Billing planning and affected indexes only, no source/runtime/evidence/credential files. Normal push to `origin/codex/billing-planning` succeeded with upstream set; live remote head matched the intended local planning checkpoint. This publication-state handoff is included in the same branch and its remote head reverified after push. Git remains authoritative for exact heads/synchronization. No PR creation/merge, feature acceptance, implementation, tests, database access, installation or deployment authorized/performed. Seven untracked ledgers and pending incident reviews preserved; incidents: none in this publication task.

## BP-01 authorization and source isolation — 2026-10-26

User explicitly accepted revised BP-00 and authorized BP-01 source implementation for seven routes and BP-A01–18, supported Orders/Business interfaces and Nest exports, owned persistence/history and migration source, affected module documentation, meaningful focused offline checks with existing dependencies, bounded agents and focused local Conventional Commits. Checkout verified at `248ddad` on `codex/billing-planning`; tracked clean; seven untracked ledgers preserved. Reuse this checkout; integration base remains `d75ac92`. Publication for this increment is unauthorized.

Isolation agreed before source edits: implement an explicit BillingModule composition but do not import it into AppModule; Business display HTTP composition remains separately unmounted. Existing Orders provider additions may be exported without activating financial routes. No live settlement routes, sample policy defaults, environment/database access, migration execution, installation, upstream accepted reruns, push/PR/merge, deployment, real operation or BP-02 activation. Synthetic values exist only in offline tests. Schema/migrations are source only.

Shared contracts are the accepted spec's exact PolicyView, AssessmentView, BillView, DisplayView, SettlementRequest and financial projection; existing opaque AuthorizedScope/TransactionContext must cross supported public interfaces only. Billing uses one runAuthorized callback for assessment/settlement/settings edits and scoped read context for GET. Business never imports Billing. Detailed non-overlapping assignments: [collaboration](agent-collaboration.md#bp-01-source-assignments).

| Active task | Owner | Expected evidence |
| --- | --- | --- |
| Exact policy/selection/money domain | Money agent | BP-A02/14–18 deterministic offline cases |
| Narrow Orders financial and Business display source | Interface agent | BP-A01/06/09/10/12 projection/admin cases |
| Billing application/HTTP source | Application agent | BP-A01/03/04/07/08/11/13 offline cases |
| Composition, owned persistence/migration, integration/docs | Primary | Build, architecture, focused Billing checks; BP-02 gaps explicit |

Completion shape: reviewable isolated source for the seven contracts, no runtime activation or persistence execution. Development acceptance remains the user's decision.

## BP-01 delivery evidence — 2026-10-26

Implemented source: five Billing routes plus two Business display routes using shared DTO validation/contract guards/envelopes/Problem Details; finite policy/retired identity/history; exact BigInt inclusive allocation, line rounding and explicit charge bases; selection-sensitive durable requests and replay precedence; immutable full-cash aggregate and scoped known-order readback; narrow Orders/Business providers with matching Nest exports. `BillingModule` composes the isolated seven-route graph, including Business's separately exported HTTP module, without AppModule registration or a Business→Authentication module dependency cycle. Business owns display tuple/history; Billing owns policy/history/settlement. Migration `0006_billing_cash.sql` and generated snapshot/journal are source only.

The approved standard currency registry was moved byte-for-byte to `common/currency-precision.ts` for concrete Menu/Orders/Billing reuse; Menu retains its old compatibility export. No precision values, existing route behavior, capture limits or Kitchen state were changed. Planning documents moved into this module structure; old locations retain transition links and incoming links were updated.

| Acceptance | Focused offline evidence | Limits |
| --- | --- | --- |
| BP-A01/03/04/08/12/13/16 | Application synthetic authorized transaction/store: role/CSRF delegation, absent policy/order, stale revisions before selector validation, note no-op, selection-sensitive and revision-sensitive replay, changed policy/display replay, rejected commit | No real Access lock/DB concurrency or actual commit outcome proof |
| BP-A02/14/15/16/17/18 | Independent approved sample expectations; included remainder/UUID ties/zero rates; mixed bases, fixed/percentage/automatic/optional; both rounding modes, quantity-before-rounding, multi-line totals, max8+8, nested identity/reference/null/canonical validation, retired IDs, overflow/zero/currency, exact 2 MiB boundaries | No fiscal applicability or operational policy evidence |
| BP-A06/07/09/10/11/14 | Orders projection allowlist and corrupt source cases (including numeric money/noncanonical time); Business tuple revision/history/no-op/max; actual seven-controller HTTP injection, strict DTO/query/path, nested values, media/malformed JSON, Location/replay status, no-store/correlation, safe failures/output | Kitchen-free dependency inspected and Orders immutable fixture checked; no historical upstream rerun or claim of three live Kitchen-state integration cases |
| BP-A04/05/11/18 | Synthetic Drizzle driver verifies scoped SQL, aggregate insert, uniqueness-failure rollback propagation, known-unavailable mapping; module metadata verifies provider exports and startup isolation; migration source uniqueness/no sample data checked | SQL construction is not PostgreSQL constraint/concurrency/rollback/fresh-process evidence; BP-A05 actual fresh-process persistence remains wholly unexecuted |

Executed with existing Node 24.21.0 runtime and existing dependencies: fresh full TypeScript compilation to `apps/api/dist/billing-check`; 25 distinct focused Billing cases passed across final relevant invocations (8 money, 4 application, 5 interfaces, 3 seven-route HTTP, 5 adapter/composition); repository HTTP architecture scan (30 files, zero violations) and 7 checker fixture cases passed; whitespace/local-link/source review. No environment file/configured target was read; no database, migration runner, installation, production startup, push/PR/merge or deployment. Generated SQL came from credential-free `drizzle-kit generate` only. Task-owned root and API Billing compilation outputs were removed after verification; checked-in tests reproduce them.

Integration review corrected known-connection failure classification and fail-closed captured timestamp/numeric-money validation before delivery; focused regressions cover these. These were in-progress implementation findings, not delivered verification claims. No qualifying incident identified.

Remaining persistence gaps: actual migration application and integrity constraints; trusted multi-scope isolation; Access serialization with competing same/different keys and policy/display edits; rollback of aggregate/history; uncertain commit recovery; durable retired IDs; fresh API-process immutable readback; bounded owned cleanup. BP-02 remains inactive and unprepared. Source/offline completion is not acceptance or restaurant readiness.

## BP-02 preparation authorization — 2026-10-26

User explicitly authorized preparation only: bounded persistence verification procedure/harness, synthetic fixtures and owned cleanup design, focused offline checks using existing dependencies, affected documentation and focused local Conventional Commits. Recorded before preparation edits. Verified HEAD `7d5a76a`, BP-01 checkpoint `13f50bc` is an ancestor; branch `codex/billing-planning`, integration base `d75ac92`. Reuse this checkout; primary agent owns preparation and Git. Subsequent instruction/incident commits and seven untracked ledgers preserved. No delegated work.

No installation, environment/database access, migration execution, live route activation, real operation, push/PR/merge or deployment. No upstream accepted reruns or expanded Billing scope. BP-01 acceptance remains separate; pending incident reviews unchanged.

| Preparation task | Status | Expected evidence |
| --- | --- | --- |
| BP-02 procedure and synthetic fixture/cleanup design | Complete | BP-A01/03/04/05/09/10/12/13/16/18: isolation, contention, revision races, rollback, immutable history, retired IDs, fresh-process readback; baseline/migration/stop/recovery/cleanup gates |
| Offline validation and handoff | Complete | Existing-dependency checks of fixture/manifest/refusal design; explicit execution gaps and exact next authorization |

Completion shape: reviewable procedure and offline preparation artifacts only; no persistence pass, phase acceptance or execution permission inferred.

## BP-02 procedure preparation result — 2026-10-26

Delivered [bounded procedure](database-acceptance.md) and offline `tests/bp02-plan.mjs`/`bp02-plan.test.mjs`: B01–B07 map isolation, same/different-key contention, both policy/display race orders, atomic rollback/history, durable retired IDs, immutable replay and fresh-process readback. Pre-0006 exact six-history/sixteen-empty-table gate; only pending 0006 scope; post-0006 seven-history/twenty-empty-table cleanup proof. Stop/uncertain-outcome recovery and owned ledger design are explicit. Procedure form selected; no executable database runner or execution-ready command is claimed.

Existing Node 24.21.0: four focused offline preparation tests pass, including refusal mutations and duplicate/missing/changed ownership. They validate the source-derived plan/helper, not actual catalog, PostgreSQL behavior, migration execution, target suitability, concurrency, fresh process or cleanup. No TypeScript/application change; no environment/database access, upstream suite rerun, installation, route activation or publication. All runtime criteria remain unexecuted. Execution tooling review and fresh named-target/exclusive-reservation/run authorization remain gates; additional preparation permission is not needed within the already authorized scope.

BP-01 is still awaiting user review/acceptance. Seven prior ledgers and accepted upstream contracts/evidence preserved. Incidents: none in this preparation; 21 existing pending user reviews unchanged.
