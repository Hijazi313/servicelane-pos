# Order capture — Phase tracker

Specification: [spec.md](spec.md). Owner: primary agent. Phase: OR-01. Status: complete under explicit user acceptance on 2026-10-21; recorded backend development scope and evidence limits retained.

## Authorization — 2026-10-20

User explicitly authorized OR-01 source implementation, narrow supported transactional Menu consumer, necessary migration source files without execution, affected docs, focused existing offline checks and local Conventional Commit checkpoints. No installation, database access/migration execution, provisioning, deployment, push, PR mutation or merge. Preserve local README commit 42825d1 and untracked MN-01 ledger. Solo assignment covers Orders and its necessary Menu/composition/migration consumers.

## Completed tasks

| Task | Status | Exit evidence |
| --- | --- | --- |
| Menu consumer and exact snapshot contract | implemented | OR-A02/A03/A05; focused offline tests below |
| Capture/read/settings and persistence source | implemented; bounded PostgreSQL cases passed | OR-A01–08; compile and focused application/HTTP tests below |
| Migration source and documentation | implemented; 0004 applied on testing target | Five history entries verified; [result](#persistence-integration-result--2026-10-21) |

## Completion shape

Capture/read and business-scoped limit settings, no dispatch/payment/fiscal totals. Focused offline checks plus the [single bounded PostgreSQL run](#persistence-integration-result--2026-10-21) establish atomic capture/rejection, scoped retries/isolation and fresh-API-process readback on the testing target. User accepted this bounded backend increment on 2026-10-21. Operational personal-data policies, full trading flow and release recovery validation remain separate.

## Evidence — 2026-10-20

- Full TypeScript project compilation to the existing ignored check-output pattern passed with the pre-existing supported Node 24.21.0 runtime; no installation or configuration loading.
- [Orders application tests](../../../../../../tests/orders.test.mjs) and [actual HTTP tests](../../../../../../tests/orders-http.test.mjs): 13 passed in the final combined run after the injectable-file naming and type-dependency cleanup. Actual Authentication/Menu services run against substituted transactional persistence. Covered current role/session/grant/CSRF enforcement, scoped reads, exact configured/combo amounts, immutable optional customer/instruction snapshots, price-conflict resubmission, JSONB-key-order-insensitive replay after Menu/policy changes, concurrent attempts, injected rollback, safe errors and body/expanded-response limits. Boundary helper checks include inclusive/one-byte-over and multibyte JSON. These are offline observations, not PostgreSQL concurrency/recovery evidence.
- Existing Drizzle generator produced [0004_order_capture.sql](../../../../../../migrations/0004_order_capture.sql), journal and snapshot offline. `readMigrationFiles` parsed all five migrations; snapshot comparison established all 13 prior table definitions unchanged, with only captured_orders/order_capture_policies added. Source constraints include scoped retry uniqueness, retry-key format, basic JSON identity and policy bounds. No migration execution or database access.
- Existing Menu database acceptance/report and ledger remain historical and unchanged. No old harness run, broad suite or production build performed. Source-import/export review found no foreign persistence imports, new RBAC, decimal/precision duplication, nested authorization or query-builder exposure. The broader transport-boundary assurance is retracted; see [INC-20261020-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-01--domain-http-status-coupling-carried-into-orders-and-missed-at-handoff).

## Availability and acceptance

OR-A01–08 have focused offline and bounded PostgreSQL evidence as mapped in the [integration result](#persistence-integration-result--2026-10-21). Observed lock contention/uniqueness/rollback and fresh-process readback passed; lost-response retry is simulated, not arbitrary network-partition or crash-recovery evidence. Explicit user acceptance is [recorded below](#acceptance-and-closeout--2026-10-21); no complete trading or release claim. The aggregate stores lines in one JSON snapshot, avoiding independently mutable line records.

## Historical source handoff — 2026-10-20

- Source: Orders application/domain/controller/filter, owned schema/adapter/module, narrow Menu consumer, composition and generated migration. Docs: canonical specification/capabilities; discovery is a transition reference only.
- No push or PR mutation performed. Draft PR #10 remains at verified 0083da0; unrelated README commit 42825d1 is preserved locally. Ledger remains untracked and excluded.
- Next: review the local source/offline increment. To obtain persistence acceptance, separately authorize a reviewed target-specific OR-01 procedure, fresh compilation, migration application, synthetic fixtures, bounded concurrency/restart/failure cases and owned cleanup. Do not infer permission to use the migrated Menu target or rerun its harness. Backend development acceptance/rescoping, if desired, needs an explicit user decision.
- Operational customer retention/erasure, full kitchen/payment/fiscal workflow and release validation remain separate from this development increment.
- Incidents: [INC-20261020-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-01--domain-http-status-coupling-carried-into-orders-and-missed-at-handoff). Existing incident reviews remain unchanged; no skill/template/guardrail edits.

## Uncommitted boundary correction — 2026-10-20

User authorized the Menu/Orders error-boundary correction under existing guidelines and explicitly prohibited commits pending personal verification. Scope: semantic MenuError reasons and OrdersError codes without HTTP status members; exhaustive status mapping in Menu HTTP helper/Orders filter; affected callers, docs and focused tests. No source changes to Authentication's accepted error contract, schema, money, pricing or retry behavior. No commit, staging, push, PR mutation or database access.

Compilation passed to both existing check-output directories with the pre-existing supported Node 24.21 runtime. The four affected Menu/Orders application/HTTP files passed all 25 tests, including actual HTTP mapping coverage for all nine Menu reasons and all thirteen Orders codes. Domain assertions require absence of the status member; public HTTP statuses, safe response bodies, no-store headers and reconfirmation details are preserved. Three direct Menu-error assertions in the old MN-01 harness were adapted to reason names and syntax-checked only; historical execution evidence/ledger unchanged, no harness execution.

Correction evidence: [INC-20261020-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-01--domain-http-status-coupling-carried-into-orders-and-missed-at-handoff). Source correction is verified offline; incident remains open to user review, not closed. Next: user reviews the uncommitted diff and decides whether to accept/commit it. PostgreSQL and broader operational acceptance remain pending as above.

Process review: [INC-20261020-02](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-02--documented-constraints-were-read-but-not-enforced-when-reusing-code) owns the separate user-requested assessment of documented-rule enforcement. Open; no instruction/skill/guardrail edits or commit authorized by this record.

## Local correction commit authorization — 2026-10-20

User explicitly requested committing the existing correction and incident documentation before later architecture-check work. This supersedes the earlier no-commit restriction only for this checkpoint. Existing compilation/25-test evidence is reused; subsequent inspected source changes are formatting-only. Incident closure, new checks/guardrails, database work, push and PR mutation remain unauthorized.

## Authorized publication — 2026-10-21

The user authorized committing/pushing the existing architecture guard and checking GitHub integration, without merge. The existing Orders source/error-correction commits were already on the topic remote at preflight. PR #10 remains draft and its description now reflects implemented source and pending persistence/user acceptance rather than planning only. [Checker remote evidence](../../../../../../scripts/README.md#github-actions-verification--2026-10-21) owns CI outcomes; it does not establish Orders database acceptance. Historical no-push statements above describe their original phase authorization.

## Persistence preparation — 2026-10-21

User authorized read-only migration/source review, focused persistence acceptance preparation, affected docs and necessary offline verification, with all changes uncommitted. No database access or migration execution, installation/provisioning/deployment, push/PR mutation/merge, old Menu harness rerun or incident closure/policy edits. Primary agent owns this solo assignment.

- Git/PR preflight: `codex/orders-discovery`, local and GitHub PR #10 head `eab89868e720d66c5e7601602747516a90f0c88f`; PR open/draft against main. GitHub exact-head HTTP-boundaries and PR-title checks are successful (runs 39563637099 and 39563696665; earlier same-head title run also green). Authentication correction `ba72346` is included; subsequent diff is evidence documentation only. Passing checks reused, not rerun.
- [Prepared acceptance procedure](database-acceptance.md) covers OR-A01–08 with real-adapter atomic/rejection/isolation/money/JSONB cases, observed concurrent retries/conflicts, historical replay after Menu/policy changes and fresh-process reconnect/readback. Procedure is prepared, unrun; executable OR-01 runner is not yet implemented. Existing Orders tests/restart lifecycle and historical evidence are reused as design inputs.
- User identified current staging as the candidate target. Offline `.env` inspection records its non-secret endpoint in the procedure; migration URL defaults to application URL. Current database identity/history remain unverified. Last historical Menu result is 0003 applied/thirteen empty tables, not a current baseline. No configuration execution or database connection occurred.
- Bounded source review found no new material defect; application scope/immutability are not fully SQL-enforced, and current lock/transaction guarantees still require PostgreSQL observation. No public behavior changed, so capability indexes remain accurate. Documentation/link/diff verification only is appropriate; no compilation/test rerun needed for this preparation.
- Next: obtain separate explicit read-only inspection authorization for the identified current staging configuration. Verify identity/history/schema/emptiness and report before proposing write execution. Complete/review focused runner instrumentation before later one-run authorization for only 0004, synthetic fixtures, cases and owned cleanup. Staging identification alone does not authorize either database gate or confirm exclusive reservation.
- Source/offline increment remains awaiting acceptance; specification approval is recorded, implementation is delivered, persistence is unverified and user acceptance is pending. Untracked MN-01 ledger preserved/excluded. Incidents: none in this preparation; existing pending reviews unchanged, including INC-20261020-01/02. No incident closure or skill/template/guardrail change.

## Authorized read-only baseline — 2026-10-21

User replied “yes” to the explicit read-only identity/history/schema/count inspection request. This authorizes database reads only, not migrations, fixtures or cleanup writes. [Sanitized report](../../../../../../tests/evidence/or01-readonly.2026-10-21.json) and [procedure assessment](database-acceptance.md#authorized-read-only-baseline--2026-10-21) own observations/limits.

Result: current configured staging matches the historical target fingerprint, PostgreSQL 17.11; thirteen empty application tables; 0000–0003 history hashes/timestamps match; only 0004 pending. Snapshot 0003 columns/types/nullability/constraint names match; public objects are thirteen tables/twenty-three indexes with no user triggers/public functions. Read-only transactions rolled back and pools closed. Existing TLS certificate verification remains disabled; no verified TLS identity claim. Initial sandboxed connection failed before checks; network-authorized identical probe passed. No migration or fixture write, old harness execution, test rerun, Git mutation or incident change.

Next: complete/review the focused OR-01 runner under preparation scope, then obtain separate explicit one-run permission for fresh baseline, only 0004/history update, synthetic fixtures, bounded cases/processes and owned cleanup on the confirmed exclusively reserved target. No execution permission is inferred from this read-only approval. Persistence acceptance and user acceptance remain pending. Incidents: none new; pending reviews preserved. All preparation/evidence changes remain uncommitted; unrelated MN-01 ledger remains excluded.

## Focused integration runner preparation — 2026-10-21

User instructed “let’s get this done” after the runner explanation. Current work completes preparation and focused offline verification; migration/fixture execution remains separately gated. Intended outcome: a reviewable executable runner for the prepared OR-A01–08 cases, refusing execution without target/write opt-ins. No production behavior changes, Git mutations, database access or incident-policy edits in this increment.

Temporary parallel assignments share this checkout and existing branch without integration commits: primary agent owns parent runner, baseline/cleanup controls, offline checks, evidence and documentation; cases agent owns only `tests/or01-cases.mjs`; restart agent owns only `tests/or01-runtime.mjs` and `tests/or01-restart.mjs` (paths relative to apps/api). Shared source/contracts/migrations/package files remain unchanged. Primary agent reviews combined instrumentation before handoff. No agent may execute database cases. Existing passing application/CI evidence is reused; new runner controls require focused offline evidence.


### Runner preparation result

Prepared parent/control/cases/runtime/fresh-child instrumentation and six focused offline checks. Fresh compilation, offline preparation tests, syntax and whitespace/link checks passed. Coverage maps to P01/R01/R02/I01/C01/C02/H01/D01 in the procedure; only substitute-backed preparation behavior has run. No current PostgreSQL concurrency/fixture/cleanup/restart result is claimed. Existing application/CI successes are reused. Review corrected fixture-name ownership, partial-setup ledger timing, concurrency context wiring and session baseline ordering during preparation; no new qualifying incident, existing reviews unchanged.

The [proposed command and exact one-run boundary](database-acceptance.md#reviewed-one-run-command--historical) are ready for user review. Next required authorization: exclusive reservation of current configured staging for one fresh baseline, only 0004/history migration, synthetic fixtures, bounded integration cases/two fresh API children, and owned cleanup. No database access occurred in runner preparation. Changes remain uncommitted; MN-01 ledger remains untracked/excluded. Specification approved; implementation delivered; persistence verification and user acceptance remain pending.

## Workflow completion authorization — 2026-10-21

User requested completing all work that does not require their input, pushing changes to GitHub and completing the workflow. This supersedes the earlier uncommitted/no-publication restriction for this increment: focused local commits, normal topic push, PR metadata/readiness and exact-head CI review are authorized. The bounded database run is requested, with exclusive staging reservation awaiting explicit confirmation before dependent writes. Operational deployment, real data, infrastructure changes and incident closure remain outside scope. Persistence evidence and explicit product acceptance remain distinct; workflow completion is not a fabricated acceptance record.

## Bounded staging execution authorization — 2026-10-21

In response to the explicit staging reservation/exclusive-writers gate, user replied “this is for testing so you can do anything.” Together with the preceding instruction to complete/push the workflow, this authorizes proceeding on the current configured testing target with the reviewed bounded procedure: fresh compilation/baseline, only 0004/history update, synthetic fixtures, focused cases/two fresh API children and owned cleanup. No broader resets or production actions are inferred. Existing mismatch/defect/ambiguous-outcome/cleanup stop conditions remain. The human response supplies the reservation gate; it is not a technical guarantee against every external writer. New user input about test frameworks is answered while execution continues. Feature acceptance and incident review remain separate.


## Persistence integration result — 2026-10-21

Fresh compilation and the single authorized run completed at 23:10 Asia/Karachi. [Sanitized report](../../../../../../tests/evidence/or01.2b001f56-d609-434b-a3a3-dd7a372b5eca.json) records all eight P01/R01/R02/I01/C01/C02/H01/D01 cases passed, both observed advisory-lock waits, exact ordinary/high amounts, key reuse after rejection/rollback, foreign-row/authority denials, replay after Menu/policy changes, and two fresh API processes plus parent reconnect. Both concurrency cases committed exactly one scoped aggregate. Cleanup verified fifteen application tables empty and all five migration history hashes/timestamps intact. Migration 0004 remains applied. No runtime failure, additional dependency, old Menu harness run or production action.

This establishes bounded PostgreSQL behavior for OR-A01–08 together with reused offline evidence, not a full trading flow, reciprocal two-installation execution, database-server restart/crash recovery, backup recovery, production TLS or user acceptance. Current TLS certificate verification was disabled and unchanged. The one-run permission is consumed; a repeat requires a separately reviewed post-0004 baseline, not rerunning the historical command. Raw ownership ledger remains local/untracked with the existing MN-01 ledger; only sanitized report is publishable.

### Integration handoff before acceptance

User-requested GitHub workflow is complete for the implementation/evidence: [PR #10](https://github.com/Hijazi313/servicelane-pos/pull/10) squash-merged as `2daeb6c8b899dfda740c50fd8c1f525198fde1b4` after exact-head `2168329` HTTP-boundary and PR-title checks passed, with no reviews or unresolved review threads. The [main-branch HTTP check](https://github.com/Hijazi313/servicelane-pos/actions/runs/39650850869) also passed at the merge commit. Local main was fast-forwarded and GitHub removed the remote topic branch. This technical integration is separate from explicit feature acceptance; no later module/phase is activated. Both local acceptance ledgers remain untracked/excluded. No skill/template/guardrail changes or incident closure. [README status correction](../../../../../../../../docs/quality/agent-incidents.md#inc-20261021-01--published-orders-source-retained-planning-only-readme-status) records the documentation omission discovered at closeout; prior pending reviews remain unchanged.


## Acceptance and closeout — 2026-10-21

User explicitly stated: “I accept OR-01 under its recorded backend development scope and evidence limits,” and authorized documentation closeout only. OR-01 is complete. Specification approval, source implementation, bounded persistence verification and technical integration retain their separate historical records; this instruction supplies the previously pending user acceptance.

Accepted outcome: authorized branch-scoped takeaway capture/readback, server-resolved immutable merchandise/customer/instruction snapshots, exact amounts, business-configurable limits and duplicate-safe retries. OR-A01–08 are supported by the recorded offline evidence and [single passing PostgreSQL run](#persistence-integration-result--2026-10-21). Evidence reused without checks or database execution. Migration 0004 remains applied on the testing target; the run verified fifteen application tables empty after owned cleanup. PR #10 and documentation closeout PR #11 are merged; this acceptance closeout changes documentation only; the earlier authorization to complete the GitHub workflow remains applicable.

Acceptance does not establish a full trading flow, production readiness, verified production TLS, reciprocal two-installation execution, database crash/backup recovery, kitchen dispatch, payments/tax totals, amendments or operational personal-data policy. Previous one-run execution authorization remains consumed; acceptance grants no further database run or new phase. Existing incident reviews remain pending; no incident closure or policy/skill/template change.

### Current handoff

Subsequent handoff — 2026-10-23: [Kitchen KT-01 tracker](../../../../kitchen/docs/features/preparation/phase-tracker.md) owns the approved next increment, narrow transaction-aware Orders preparation consumer and source/offline evidence. User authorized KT-01 source/offline checks/local commits after approving the revised plan and merging PR #13. OR-01 remains accepted/closed; Kitchen/PostgreSQL acceptance, renewed database access and source publication remain separate and unauthorized.

Closeout authored from main at `5ecae6c`; acceptance changes are documentation only and follow the normal topic-branch/PR workflow under standing publication authorization. Preserve both untracked MN-01/OR-01 ownership ledgers and historical evidence; exclude ledgers from Git changes. No local test/database checks rerun, database access or implementation in this closeout. Git publication follows standing authorization; no later phase is activated. Incidents: [INC-20261021-02](../../../../../../../../docs/quality/agent-incidents.md#inc-20261021-02--documentation-closeout-left-uncommitted-despite-standing-workflow-authorization) records the corrected publication omission; prior pending reviews remain unchanged, including [INC-20261021-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261021-01--published-orders-source-retained-planning-only-readme-status).
