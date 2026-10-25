# Kitchen handoff — phase tracker

Date: 2026-10-22. Owner: primary agent, solo. [Specification](spec.md); [business decisions](decisions.md); [global tracker](../../../../../../../../docs/planning/TRACKER.md).

Status: KT-02 blocked at fresh-process verification. Post-0005 K01–K04 passed; D01 remains unverified. Owned cleanup passed with sixteen empty tables and all six history entries retained. Kitchen acceptance remains pending.

## Authorization and verified entry

User requested the smallest justified Kitchen increment and Orders handoff, P0 scope, acceptance criteria, phases and options, starting from accepted OR-01. Authorization: planning/documentation and standing GitHub workflow for completed documentation only. No implementation, database access, test reruns, installation, provisioning, deployment or later phase activation. Publishing a proposal does not approve its business rules. Merge permission remains separate from push/PR publication under CONTRIBUTING.

Local main and remote main both verified at `6125da43245f50f52730d122792f7d01418f013a` on 2026-10-22. OR-01 is accepted/closed; [canonical upstream closeout](../../../../orders/docs/features/capture/phase-tracker.md#acceptance-and-closeout--2026-10-21) retains historical evidence/limits. Reused checkout; topic `codex/kitchen-planning`, base `6125da4`, primary agent owns documentation integration. No unrelated tracked modifications at entry. Both local Menu/Orders ledgers remain untracked/excluded; pending incident reviews remain unchanged.

## Phases and gates

| Phase | Outcome / status | Entry and exit |
| --- | --- | --- |
| KT-00 — planning | Complete: documentation prepared and KT-D01–04 resolved | Entry: current request. Exit met for business planning: owner resolved KT-D01–04. Technical review is now delivered below; owner approval of the revised specification remains separate from implementation authorization. |
| KT-01 — backend handoff | Source/offline checks delivered; acceptance pending | Entry: approved decisions/spec plus explicit source/check authorization. Intended outcome: KT-A01–06, one transaction-aware Orders projection, trusted Authentication actor-scope extension and Kitchen ticket/queue/status boundary. Before coding, confirm contracts, bounds, revision/retry semantics and capability upkeep; no standalone Orders reopening or unrelated fixes. Exit: authorized source/offline evidence recorded, unavailable persistence behavior explicit. |
| KT-02 — bounded integration acceptance | Blocked: K01–K04 passed, D01 unverified | Entry: reviewed procedure for current post-0005 baseline, explicit target/run/fixture/cleanup permission and acceptable source evidence. Objective: persisted atomicity/concurrency and fresh-process KT-A01–05 evidence; explicit user development acceptance remains separate from technical checks/integration. No old Menu/Orders harness rerun or inherited target permission. |

No later phase is detailed or activated. If payment-first or amendments/cancellation are required in the first slice, revise KT-01 prerequisites and criteria before source authorization; do not silently expand this plan.

## Planning tasks at KT-00 handoff (historical)

| Task | Status / evidence |
| --- | --- |
| Verify accepted Orders entry, checkout and preservation | Complete by Git/source/document inspection; no behavioral rerun |
| Challenge phase P0 and specify acceptance | Prepared in [specification](spec.md#outcome-and-smallest-justified-scope) and [criteria](spec.md#acceptance-criteria); proposed, not approved |
| Present material business alternatives | Prepared in [KT-D01–04](decisions.md); KT-D01–04 approved for development; future configuration mechanism remains proposed |
| Publish coherent documentation | [PR #13](https://github.com/Hijazi313/servicelane-pos/pull/13) subsequently merged under KT-01 activation below |

## Completion shape and evidence limits

This planning increment provides a reviewable conditional backend scope and a narrow Orders-owned handoff design. It provides no Kitchen API, schema, migration, queue, dispatch or status implementation. Existing Orders capture/readback and its accepted evidence are unchanged. All KT-A01–06 behavior is unavailable; source inspection of upstream contracts is not proof of Kitchen behavior. No tests, database access or installation performed. Documentation links/diff and ledger preservation are the only task verification. Existing automatic GitHub test/install workflow must not be used to bypass this task's no-rerun/no-install boundary; use a skip-CI documentation commit and report missing checks, without claiming integration complete.

## Current handoff

The [post-0005 execution result](#post-0005-execution-result--2026-10-25) owns current evidence: K01–K04 passed, fresh-process stage failed and D01 is unverified; owned cleanup passed. The one-run permission is consumed. Next action: authorize bounded offline D01 diagnosis; no retry, source repair, database access or later workflow is inferred. Preserve the four local ownership ledgers and all reports, including prior evidence and pending incident reviews. Active branch `codex/kitchen-handoff`; local evidence/repair/preparation remains unpublished. OR-01 remains accepted/closed; Kitchen acceptance is pending. Historical handoffs below retain their original limits. Process incident: [INC-20261025-02](../../../../../../../../docs/quality/agent-incidents.md#inc-20261025-02--kt-02-follow-ups-fragmented-progress-and-required-repeated-user-coordination); recording does not authorize D01 work or change execution gates.


## Technical review — 2026-10-23

User authorized technical review and documentation corrections, focused commits/push/PR updates only; explicitly prohibited merge, implementation, database access, tests, installation, provisioning, deployment and later-phase activation. PR #13 was open with remote head `669c2c6f9a1ee96f297094843c17af4023b4f999` and base `6125da4`, matching this checkout; only the two expected untracked ledgers were present. Existing instructions/public capability indexes and exact affected contracts were reused/checked; no upstream source or capability availability changed.

Review corrections in the [specification](spec.md#source-baseline-and-ownership): identify the transaction-aware Orders read prerequisite and additive Authentication actor-scope prerequisite, explicitly strip nested surcharges and preserve combo quantity semantics, bound full-ticket responses and summary pages, define finite keyset scans independent of wall-clock order, and specify immediate versus delayed transition retries with retained attribution. [Decision wording](decisions.md) and KT-00 exit now reflect already-recorded approvals. These refine proposed technical mechanisms without changing KT-D01–04, reopening OR-01 acceptance or introducing operational workflows.

Assessment: ready for owner approval of the revised technical plan; no unresolved material business change identified within this development scope. Queue backlog/collection and correction/cancellation gates still prohibit restaurant operation. Capability indexes remain unchanged because no capability is implemented. No test or runtime/persistence success is claimed; documentation link/diff review and source inspection are the evidence. Both ledger hashes remain unchanged. Incidents: none from this review; proposed technical gaps found before source activation are addressed through normal specification review. Prior pending incident reviews remain unchanged.

Bounded next authorization proposal (not active): approve the revised KT-01 specification and authorize Kitchen backend source/schema/migration-source work, the Orders transaction-aware preparation projection, the additive trusted Authentication actor ID, affected capability/module/handoff documentation and meaningful focused offline checks with existing tooling. Permit local topic-branch commits; retain explicit boundaries for source publication/merge. No database access or migration execution, acceptance-harness execution, installation, provisioning, deployment, KT-02 or later workflows. Review/merge planning PR #13 only under explicit merge permission before integrating source work.


## KT-01 source activation — 2026-10-23

User explicitly approved the revised specification and authorized merging planning PR #13, Kitchen backend implementation/schema/migration source without execution, the narrow Orders and Authentication extensions, affected docs, focused offline checks and local commits. PR #13 was squash-merged with expected head f1044a0 as `6eeb92b7ec72103ae7e8669b774ab3aa64e5b44e`; historical documentation CI remained intentionally skipped. Local main was fast-forwarded and topic `codex/kitchen-handoff` created from that merge. No source push/PR/merge, database access, installation, provisioning, deployment or KT-02 is authorized.

Active phase: KT-01. Solo assignment: primary agent owns Kitchen source/docs/tests, the approved Orders projection and Authentication scope extensions, migration source composition and local Git integration.

| Task | Status | Acceptance / expected evidence |
| --- | --- | --- |
| Trusted actor + transactional preparation projection | complete; offline only | KT-A01/03/05; focused existing authorization regression + new projection cases |
| Kitchen dispatch/queue/transitions/schema and HTTP | complete; offline only | KT-A01–06; offline transactional double and actual HTTP checks; no PostgreSQL claim |
| Migration source, capability/docs upkeep and closeout | complete; source-only migration | Generated offline migration only; scoped compilation/boundary checks and recorded limits |

Completion shape: source/offline-verified backend API with persistence implementation unverified on PostgreSQL; no operational readiness or development acceptance inferred.

Prerequisite checkpoint: fresh compilation, 16 Orders/projection/actual-HTTP checks and six focused authorization checks passed on existing Node 24.21.0. Projection retains captured composition and instructions while stripping nested surcharges/customer data; supplied transaction and verified actor are covered. No database access; PostgreSQL behavior remains unverified.


## KT-01 source/offline result — 2026-10-23

Local branch: `codex/kitchen-handoff`, base `6eeb92b`. Prerequisite checkpoint `22da725` adds trusted Authentication actor and transaction-aware Orders preparation projection. Kitchen adds branch-scoped duplicate-safe dispatch/readback, finite position-fenced summary pages and whole-ticket state transitions, retained actor/time provenance and safe HTTP mappings. Explicit nested field mapping excludes customer/financial/policy data; Menu snapshots remain authoritative history. No source publication or merge.

| Acceptance | Source / offline evidence | Limits |
| --- | --- | --- |
| KT-A01/02 | Real AccessService with serialized rollback-capable double; concurrent dispatch, retry and injected post-insert failure; actual HTTP role/session/CSRF/origin cases | No PostgreSQL uniqueness/advisory-lock/rollback execution |
| KT-A03 | Two Orders preparation tests, nested surcharge exclusion, captured instructions/composition and three-combo/two-component multiplication; Menu removal preserves projection | Synthetic stored history; no fresh-process persisted readback |
| KT-A04 | Finite summary scan with later dispatch/status changes, malformed/oversize cursor checks, foreign scope, inclusive UTF-8 capacity and one-byte-over rejection | Reconnect/server restart and DB sequence visibility unverified |
| KT-A05/06 | Immediate/delayed retries, concurrent model requests, original attribution preservation, unsupported mutation input and untouched Orders history | No real concurrent database-update execution, collection or cancellation |

Fresh TypeScript compilation passed using existing Node 24.21.0. Six top-level Authentication checks (21 including subcases) and 16 Orders/projection/actual-HTTP checks passed for prerequisites. Final fresh compilation and all ten projection/Kitchen application/actual-HTTP/SQL checks passed. The offline Drizzle SQL/transaction-routing check passed after correcting its test-only expectation from string parameters to bigint parameters. Architecture scan: 19 files, zero violations. The SQL test uses a synthetic driver with no connection string, Pool or network; it proves query construction/routing only. `pnpm test:kitchen` uses existing tooling and the shared Orders fixture compile directory; no dependency added.

Migration `0005_kitchen_handoff.sql`, snapshot and journal entry generated offline with existing Drizzle Kit: one Kitchen-owned table, scope/order uniqueness, scoped position index and state/revision/provenance checks. Old migration sources remain unchanged. Migration is **unapplied**; no environment file was loaded, database accessed, old acceptance harness run, package installed, infrastructure provisioned or deployment performed. KT-02 requires a separately reviewed post-0004 procedure/target permission. No crash/backup recovery, operational privacy, full trading-flow or production readiness claim.


## Main synchronization — 2026-10-25

User authorized bringing the subsequently merged main changes into this feature branch. Entry checkout was clean tracked main at `ac9ce07`; remote main was fetched/verified at the same commit. Switched back to `codex/kitchen-handoff` and merged main locally, preserving both source checkpoints and both untracked ledgers. Conflicts in OrdersModule and the Orders capability index were resolved by preserving OrderPreparationService provider/export and main’s HTTP-adoption documentation. No business-rule or Kitchen HTTP-contract migration was introduced.

Main contributes PR #14 API guidance and PR #15 shared HTTP/DTO infrastructure plus the approved Menu-list/Orders-capture migration. Those contracts and dependencies are retained; dependencies were already locally present, with no installation. Kitchen endpoints remain unmarked, preserving their current contracts; adopting the new HTTP convention needs its own scoped review/authorization.

Verification: fresh compilation and all 25 focused Orders/projection/Kitchen application/actual-HTTP/synthetic-SQL tests passed on existing Node 24.21.0; architecture scan passed (20 files, zero violations). No database access, migration execution, deployment, KT-02 or source push/PR/merge into main. Existing incident reviews are retained from main; Incidents: none from synchronization. Next action remains review of KT-01 on the combined branch before further authorization.


## Persistence verification preparation — 2026-10-25

User authorized the smallest bounded procedure/harness, necessary focused offline checks and local commits only. Verified checkout `codex/kitchen-handoff` at `2728713`; both expected untracked ledgers preserved. The [prepared procedure](database-acceptance.md) owns baseline gates, five bounded observations, single 0005 migration proposal, synthetic fixture ownership, cleanup, stop conditions, evidence limits and exact future commands. Current database state is unknown; no target connection or `.env` read occurred.

Delivered manual-only kt01 parent/controls/runtime/cases/cleanup/restart instrumentation and seven focused preparation checks. Reused Orders runtime composition and safe count/hash/failure helpers plus the corrected restart idle-error lifecycle; old Orders/Menu runners remain unchanged and unrun. The post-0004 gate requires a fresh reviewed target fingerprint before any execution; it does not assume historical cleanup is still current. Fresh-process proof uses Kitchen controllers and their unchanged contracts, not the obsolete Orders child payload expectations.

Seven preparation checks passed using existing Node 24.21.0; syntax and documentation checks passed. These establish refusal/orchestration controls, not PostgreSQL correctness. No production source, migration, package/dependency, skills/templates or old report/ledger changed. Incidents: none in preparation; prior reviews remain pending.

Next action: authorize only the read-only baseline inspection on an explicitly designated exclusively reserved testing target, review its sanitized report, then separately decide the one-run 0005/fixture/cleanup execution authorization. This preparation does not activate KT-02 or authorize database access, installation, provisioning, deployment or source publication.


## Thread closeout — 2026-10-25

Thread work is preserved on local `codex/kitchen-handoff`: KT-01 prerequisites/source `22da725`/`8d18ebc`; main synchronization `2728713` includes main `ac9ce07`; prepared persistence harness/procedure `dc4b21c`; process incident record `45af699`. Planning PR #13 alone was published/merged (`6eeb92b`). Kitchen source and verification preparation have not been pushed or submitted as a PR. No database access or environment loading occurred in this thread’s Kitchen work; 0005 remains unapplied and current target state is unknown. KT-01 development acceptance remains pending and KT-02 is not active.

Tracked checkout was clean at closeout entry; only the original MN-01/OR-01 ownership ledgers were untracked. Their SHA-256 values remain respectively `7a7f5e4fc59fa18a8dbd3fae81c8b8b97aaf9d7fdeacdfa7a13838c87705bdd6` and `c3e88fe3c00044ea62ec1d1926c10a2274594cff5ce5e3eef5fbb8e7956342f2`. Preserve them and existing reports; no task-owned debug artifacts or dirty source remain. Historical offline evidence is retained without reruns.

Next action: in the new chat, obtain bounded KT-02 execution authorization and confirmation of the designated testing target/exclusive reservation. Baseline inspection is the first gate within KT-02, not a separate phase or a reason to create another chat. The prepared procedure currently requires review of the fingerprint before execute mode; any authorization to continue conditionally in the same run must be explicit. Never infer target confirmation, data emptiness or migration permission from this closeout. Stop on mismatch, material harness defect, ambiguous result or failed cleanup; no automatic retries. Keep publication, explicit acceptance, operational release and further workflows separate.

Incidents: [INC-20261025-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261025-01--kitchen-verification-preparation-repeated-excessive-context-retrieval-and-required-user-redirection) is recorded/committed, still open pending user review; commit permission did not close it or approve prevention changes. Prior incident reviews remain unchanged. Future PR bodies use the repository template; no PR is authorized by closeout.


## KT-02 bounded activation — 2026-10-25

User explicitly activated one bounded PostgreSQL verification run using [the prepared procedure](database-acceptance.md). Solo owner: primary agent, existing checkout `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, branch `codex/kitchen-handoff` at verified `6ba87ff`; `dc4b21c` and main `ac9ce07` are ancestors. Both historical untracked ledger hashes match thread closeout; preserve them and pending incident reviews. OR-01 remains accepted/closed; Kitchen acceptance is separate.

**Conditional authorization recorded before database access:** first obtain explicit human confirmation that the configured target is the intended disposable testing database and exclusively reserved for this run. After confirmation, permission covers necessary fresh compilation, read-only baseline and, only if every gate passes, one execution of only migration 0005, synthetic cases, one fresh API process and owned cleanup. The user explicitly permits using the freshly verified target fingerprint to continue from baseline to execution without another approval. This supersedes the prepared procedure's separate fingerprint-approval step for this run only; target identity and emptiness remain unassumed.

| Active P0 task | Status / required evidence |
| --- | --- |
| One gated PostgreSQL run, KT-A01–05 | Awaiting explicit target/reservation confirmation; then exact post-0004 history/schema and fifteen empty tables, K01–K04/D01 observations including real contention, retained 0005 and intact history with sixteen empty tables after owned cleanup |

Stop on mismatch, material harness defect, ambiguous migration/commit, missing contention evidence or failed cleanup. No automatic retry, gate relaxation, broad deletion, old Menu/Orders harness execution, installation, provisioning, deployment, unrelated implementation, source publication/PR/merge or later workflow. Local evidence/documentation commits are authorized. Reuse existing offline evidence; no general review or suite rerun. Completion means observed bounded evidence and cleanup recorded, not feature acceptance or operational readiness.

Current handoff: no database access or environment loading performed. Next action: obtain explicit target/exclusive-reservation confirmation. Incidents: none in activation; existing reviews remain pending and unchanged.


## Active branch publication — 2026-10-25

User authorized pushing `codex/kitchen-handoff` before continuing KT-02 and designating it the current active work branch, tracking `origin/codex/kitchen-handoff`. This supersedes the earlier source-push prohibition for this branch publication only. PR/merge and database access remain separately gated; target/reservation confirmation is still outstanding. Publish existing source/harness and this documentation checkpoint; preserve both untracked historical ledgers and pending incident reviews. No new runtime verification or acceptance is claimed.


## KT-02 target confirmation — 2026-10-25

User expressly confirmed the configured database is the intended disposable testing/staging database and exclusively reserved for this run, and instructed continuation. This satisfies the human target/reservation gate; emptiness remains subject to the exact baseline. Conditional authorization above now permits fresh compilation, baseline and, only on every passing gate, one execution with the fresh fingerprint without another approval. Checkout verified at `83bbe8c` on `codex/kitchen-handoff`; no tracked source changes. Primary agent remains sole execution owner. Stop conditions and all exclusions remain unchanged.


## KT-02 baseline stop — 2026-10-25

Fresh project compilation passed with existing Node v24.21.0. One authorized read-only baseline invocation exited 1; restricted sanitized [report](../../../../../../tests/evidence/kt01.73e81325-8849-434a-b824-7e5fc2f4698c.json) records `stage: baseline`, `category: operation-failed`, no SQLSTATE and no completed baseline/fingerprint. The report contains source/compiled/harness/migration hashes. Cause is undetermined; do not infer a schema mismatch, environmental cause or successful database connection from this result. Configured TLS certificate verification was reported false; no configuration was changed.

Migration: not run. K01/K02/K03/K04/D01: all not run. Fixtures were not attempted; cleanup not required. Pool shutdown reported no idle/close failure. No database execution, automatic retry or diagnostic database connection followed. Current target schema/history/counts remain unverified, including whether 0005 is absent. This attempt cannot establish PostgreSQL behavior or Kitchen acceptance.

Next material decision: authorize a bounded secret-safe diagnosis of the baseline operation failure before considering any new baseline attempt. Preserve this report and both historical ledgers. Incidents: none established in this run; an environmental/check failure alone is not a qualifying incident. Existing incident reviews remain pending and unchanged.


## KT-02 diagnosis and conditional continuation — 2026-10-25

User authorized diagnosis and continuation after the baseline stop. Secret-safe connection diagnosis in the restricted sandbox reported `ENOTFOUND` / `getaddrinfo`; the same read-only connection check with network escalation passed (`transaction_read_only=on`). No configuration/harness/source changes were needed. A new explicitly supervised read-only baseline with network access passed: PostgreSQL 17.11, exact post-0004 schema/history, fifteen empty tables, matching two-connection identity. Report: `apps/api/tests/evidence/kt01.4618920b-d43c-48bd-9d49-3b0578b3ac35.json`. Fresh fingerprint `1b55f59a1b8c467c8b070c0eebe59012c54e7393fb54a2b5e0b438a2be492437` is authorized for conditional continuation under the original explicit permission. Compiled/source tree unchanged since the successful fresh compile. Now permit only the single prepared execute invocation, with repeated baseline, 0005, cases and owned cleanup; stop conditions remain unchanged. This is a supervised environmental diagnosis/continuation, not an automatic harness retry or relaxed gate.


## KT-02 execution result — 2026-10-25

One execute invocation repeated/passed the exact baseline using the verified fingerprint. Migration 0005 applied and passed schema/history checks. K01 failed with sanitized `operation-failed` at stage `cases`, without SQLSTATE or recorded contention observation; K02/K03/K04/D01 remain not-run. Do not infer the precise failing operation or contention cause from this report. No source/harness correction, second execution or later database probe followed.

Owned cleanup **passed**: sixteen application tables independently counted zero, expected post-0005 schema validated and six exact migration history entries retained. Migration 0005 remains applied. Pool shutdown reported no idle/close errors. Run report: `apps/api/tests/evidence/kt01.921ef3b8-8d8f-4f7f-8983-fba864fcd778.json`; successful baseline report above. Restricted run ownership ledger remains local/untracked. Both original Menu/Orders ledger hashes still match closeout.

KT-02 is blocked, not passed or accepted: duplicate-safe dispatch/rollback/contention/queue/fresh-process acceptance remains unestablished. Existing offline evidence remains valid within its limits. TLS certificate verification was disabled by existing configuration throughout; no TLS/transport assurance is claimed. No installation, deployment, old harness execution or operational workflow occurred.

Next material decision: authorize bounded offline diagnosis of K01 and improved safe failure localization if needed; any harness/source repair and another database execution require a reviewed post-0005 procedure and explicit authorization. The original post-0004 runner cannot simply be rerun. Incidents: none confirmed; K01 failure alone does not establish a delivered harness defect or application defect. Existing incident reviews remain pending.


## KT-02 offline diagnosis / proposed repair — 2026-10-25

User authorized offline K01 diagnosis and a proposed fix only. No database/environment access, source/harness edits or execution occurred in this increment. Existing seven preparation tests passed on Node v24.21.0, including rollback-double K01/K02 orchestration, refusal, barrier settlement and connection-free HTTP composition. These checks do not reproduce PostgreSQL behavior.

Source comparison found a concrete instrumentation difference: Kitchen sets the contender `application_name` only in Pool configuration, while the historical Orders runner sets it transaction-locally before Access takes its advisory lock. Kitchen's observer filters `pg_stat_activity` by that exact name. Transaction pooling could prevent the startup label from identifying the active backend; this is a plausible explanation for missing contention, not a confirmed diagnosis of K01. Hosted pooling mode and the exact failed K01 substep are unknown; the sanitized report retains only generic operation failure. No old runner was executed.

Proposed smallest repair, not implemented: (1) set the contender name transaction-locally before its Access lock, following the existing scoped Orders approach; (2) retain safe case substep identifiers and allowlisted failure codes, including whether insert barrier and required contention were reached, without raw driver messages/proofs; (3) add focused offline checks for transaction-marker ordering and failure localization. Do not alter application locks, gates or timeout limits. Actual SQL/locking correctness remains a later database question.

A new run must use a reviewed post-0005 procedure requiring six exact history entries and sixteen empty tables, skip migration application, and repeat owned cleanup. Existing post-0004 execution is consumed. Next material decision: authorize the bounded harness repair/offline checks and post-0005 procedure preparation; database execution remains separately authorized. Incidents: no confirmed new qualifying incident; the instrumentation hypothesis remains unverified. Prior incident reviews unchanged.


## KT-02 harness repair — 2026-10-25

User authorized the proposed test-harness connection-tracking and failure-reporting repair. Solo owner: primary agent, active `codex/kitchen-handoff`; only the three preserved ownership ledgers were untracked at entry. Intended behavior: transaction-local contender identification before Access lock admission; secret-safe case/step diagnostics without relaxing contention proof or other gates. No database access, installation, application-source changes, post-0005 runner implementation or execution authorized by this repair.

Implemented in Kitchen-only test instrumentation: contender composition uses a transaction wrapper that sets its label with `set_config(...,true)` before the real PostgresAccessStore lock; the original runtime remains unchanged for other callers. Case reports retain the failing step and whether contention was observed in that case, plus existing SQLSTATE and allowlisted network/domain/harness codes. Parent retains last case/step; missing barrier and missing contention get distinct safe codes. Raw errors/proofs are not emitted. Shared historical Menu/Orders helpers/runners and all old reports/ledgers remain unchanged.

Verification: all nine focused preparation checks passed on existing Node v24.21.0. New evidence covers label-before-real-Access-lock ordering, marker failure preventing work, exact safe contention-failure step and settled operations, code allowlisting and connection-free named-runtime HTTP composition. Existing refusal/cleanup/fixture-orchestration checks still pass. Syntax/whitespace checks apply; no production recompile needed for test-only JavaScript changes. These checks prove local wiring/diagnostics, not hosted pooling behavior or the historical failure's root cause. Database state remains last verified sixteen empty tables with 0005/history retained; no new database observation.

Next: prepare/review a bounded post-0005 verification procedure before requesting a new database run. KT-02 remains blocked pending that verification; Kitchen acceptance remains separate. Incidents: none confirmed in this repair; pending reviews unchanged. No task-owned temporary/debug files introduced; preserve all three local ownership ledgers.


## Post-0005 preparation activation — 2026-10-25

User explicitly authorized bounded post-0005 procedure/harness preparation, focused offline checks and local commits only. Verified entry: `codex/kitchen-handoff` at `31d2696`, solo primary owner, no tracked modifications; three existing ownership ledgers preserved. Intended behavior: refuse before config loading without explicit post-0005 acknowledgement, inspect exact six migration entries and expected sixteen empty tables with two matching read-only connection identities, then permit fixtures only under future execution authorization. No migrator import/call or schema/history writes in the prepared runner. Retain K01–K04/D01 and strict contention/cleanup/stop gates. No database access, environment loading, installation, publication or later phase is authorized. P0 task: prepare no-migration runner/procedure and prove offline acceptance/refusal paths; PostgreSQL verification and Kitchen acceptance remain pending.


## Post-0005 preparation result — 2026-10-25

Prepared the existing [procedure](database-acceptance.md), parent and controls for only the installed post-0005 state. Parent/child require `KT01_SCHEMA=post-0005` before configuration/driver loading. Baseline checks two matching read-only connection identities, exact six-entry history, 0005 schema/sequence/default and sixteen empty tables. Execute repeats that gate, marks the installed migration `retained-verified`, and contains no migrator import/call. Fixture setup rechecks emptiness under the existing lock; owned cleanup still verifies sixteen empty tables, expected schema and all six history entries. K01–K04/D01, timeouts and stop conditions are unchanged; no post-0004 fallback or sequence reset.

Verification: eleven focused offline preparation checks passed on existing Node v24.21.0. The new synthetic baseline passes the expected state and refuses eleven mutations across missing/extra migration, hash/timestamp, table/column/constraint, trigger, sequence/default and unexpected data; both read-only clients roll back/release. Existing parent/child refusal, identity mismatch, runtime composition, fixtures, contender-label ordering, failure reporting, child/barrier lifecycle and ownership rejection checks pass. Syntax/whitespace and affected local-link checks passed. No fresh production compile was necessary for test-only JavaScript preparation; a fresh compile remains required before future execution.

Readiness: prepared for an explicit one-run decision, not PostgreSQL verified or Kitchen accepted. Historical K01 cause/pooling behavior remains unconfirmed. No `.env` read, database access, fixtures/migrations/cases/cleanup execution, installation or publication occurred. Database state remains historical evidence only. All three ownership ledgers and existing reports preserved unchanged; no temporary/debug artifacts introduced. Incidents: none in this preparation; prior reviews remain pending.

Next material decision: the user approves the prepared procedure and expressly confirms the configured target's disposable testing identity/exclusive reservation for the new run; authorizes fresh compilation, one read-only baseline and conditionally one K01–K04/D01/owned-cleanup execution using its fresh fingerprint without another approval. No migration application is permitted. The exact proposed authorization is in the procedure; it is not active permission.


## Post-0005 one-run authorization — 2026-10-25

User approved the prepared post-0005 procedure and expressly confirmed the configured database is the intended disposable testing target, exclusively reserved for this entire new run. Permission: fresh compilation, one read-only baseline and only after every gate passes one synthetic K01–K04/D01 execution, one fresh API process and owned cleanup; use the fresh verified fingerprint without another approval. No migrations, automatic retry, gate relaxation, publication or later workflow. Existing stop conditions apply; Kitchen acceptance remains separate. Recorded before environment loading/database access.

Entry verified: solo primary owner, existing `codex/kitchen-handoff` at `9f8b7e4`, no tracked changes; all three preserved ownership ledgers match prior hashes. Existing offline evidence reused. Active P0 task: exact post-0005 baseline, one conditional run and observed cleanup/evidence; next action depends on those results, never automatic module closure.


## Post-0005 execution result — 2026-10-25

Fresh compilation passed using existing Node v24.21.0. The single read-only baseline passed on PostgreSQL 17.11: two matching read-only connection identities, exact migration 0000–0005 hashes/timestamps, expected 0005 schema/sequence/default and sixteen empty tables. Sanitized report: `apps/api/tests/evidence/kt01.244186db-522d-4955-8960-02e9f5604713.json`. The conditional execute invocation repeated/passed the full baseline with the fresh fingerprint; source/compiled/harness/migration hashes match across both reports. No migration was applied; 0005 was retained/verified.

| Case | Observed result |
| --- | --- |
| K01 | Passed: actual advisory wait observed; one committed ticket, retry/direct duplicate returns original, preparation/history oracle passed |
| K02 | Passed: injected failure left no partial ticket, session activity rolled back, Orders preserved and successful retry committed once |
| K03 | Passed: actual advisory wait observed, one logical transition, retained distinct stage actors and stale retry rejected |
| K04 | Passed: four pre-fence tickets, fifth only on new scan, foreign scope exclusion |
| D01 | Unverified: fresh-process stage failed with sanitized `operation-failed`, no SQLSTATE; successful child marker/readback not established |

Execution report: `apps/api/tests/evidence/kt01.6afed4c6-77aa-433c-83c4-6261b92560e3.json`. The report retains D01 as `not-run` because its result is assigned only after fresh-process verification and parent readback both succeed; the overall `fresh-process` failure stage means this verification stage was entered. It does not localize pool close, child start/exit/timeout, HTTP assertion or parent readback. Do not infer the precise failure, child process outcome or a product defect. Passing K01 under repaired instrumentation does not retrospectively prove the original K01 failure's cause.

Owned cleanup **passed**: sixteen application tables counted zero, expected post-0005 schema validated, final six-entry history exactly equals the baseline. No idle/pool-close/cleanup error was reported. Existing TLS certificate verification remains false; no transport/TLS, database-server restart or crash/backup recovery assurance. New restricted ownership ledger retained locally/untracked; all three pre-existing ledgers match their entry hashes. Reports contain hashes/sanitized evidence only. No installation, provisioning, deployment, historical runner execution, publication, automatic retry or later workflow occurred.

Readiness: KT-02 remains blocked on D01, not complete or accepted. This one-run permission is consumed. Next decision: authorize bounded offline diagnosis of fresh-process failure and a minimal repair proposal, preserving the passed K01–K04 evidence. Any repair or new database verification requires its own explicit scope; do not automatically repeat the full run. Incidents: none confirmed in this execution; the failure alone does not establish a qualifying defect. Prior reviews remain pending and unchanged.
