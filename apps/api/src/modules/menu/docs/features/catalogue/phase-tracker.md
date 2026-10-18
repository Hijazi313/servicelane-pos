# Menu delivery — Phase tracker

Parent: [Menu](../../README.md) / [global tracker](../../../../../../../../docs/planning/TRACKER.md). Solo owner: primary agent.
Catalogue: [spec](spec.md) / [decisions](decisions.md). MN-00 contract: [Authentication specification](../../../../authentication/docs/features/access/spec.md#mn-00--transactional-module-authorization).
Status: active. Current phase: MN-01 (source delivered; database acceptance pending). Sequence: MN-00 → MN-01.

## Authorization — 2026-10-18

The earlier MN-00 source instruction authorized MN-00 source implementation, affected documentation and focused existing offline checks. No installation, database access, migration execution, provisioning, deployment, Git mutations or MN-01 implementation. That superseded the earlier documentation-only restriction for MN-00. Current MN-01 approval is recorded in the activation section below.

Concrete contract confirmed before source edits: `AccessService.runAuthorized<T>(proof, policy, callback)` with policy `staff | administrator`; callback receives `{ installation, transaction }` and returns `Promise<T>`. Existing access lock → current principal/context/session-CSRF validation → transactional activity touch → awaited callback → commit. A private callback-failure marker distinguishes consumer errors (rethrow for consumer boundary mapping) from authentication/storage/commit/rollback failures (sanitized access errors). Existing HTTP decorator/proof/types gain `http/public.ts` exports. No Menu caller, route, migration or new framework.

User authorized planning/documentation only, then configurable Menu behavior, and now “update the docs accordingly before kicking things off.” This authorizes incorporating the reviewed MN-00/MN-01 structure, existing authorization explanation, simplified scope and acceptance. It does not authorize source implementation, installation, database access, provisioning, deployment or Git mutations. Business defaults and phase cuts remain in MN-D01–06 for MN-01 scope review; MN-00 authorization does not approve them.

BA-03 is accepted and merged on main per user instruction. Its [development acceptance and deferred evidence](../../../../../../../../docs/planning/business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) remain closed and unchanged. No second target or BA reopening is required by this plan.

Assignment: solo primary agent owns MN-00 Authentication application/public HTTP integration, focused tests, the existing test script and affected docs. No Menu source, migrations, dependency changes or concurrent assignments. Previously staged planning changes remain staged unchanged; MN-00 revisions are unstaged.

## Phases and gates

| Phase / task | Status | Deliverable / exit evidence | Entry gate |
| --- | --- | --- | --- |
| Planning revision | complete | Spec, decisions, phase sequence and independent acceptance checks documented | Current documentation instruction; no implementation acceptance implied |
| MN-00-T01 — transactional authorization reuse | complete | [MN00-AC01–05](../../../../authentication/docs/features/access/spec.md#mn-00-acceptance); focused seam evidence and explicit user development acceptance | Contract recorded above; current user authorizes MN-00 source/offline checks only |
| MN-01-T01 — protected catalogue and selection resolution | active | [MN-AC01–06 families](spec.md#acceptance-steps), focused evidence and explicit user development acceptance | Accepted MN-00; scope/decision review and separate MN-01 source authorization |

MN-00 was explicitly user-accepted on 2026-10-18; its recorded development evidence/limits remain unchanged. MN-01 source/offline evidence is delivered. The latest authorization below permits bounded database acceptance preparation and local checkpoints only. Database execution and user MN-01 acceptance remain pending.

Before database-backed acceptance, prepare the concrete procedure/fixtures and obtain authorization for one named disposable target, migration/write scope and cleanup. No inherited BA execution permission, database contact or provisioning. Focused offline checks do not prove actual transaction rollback, revocation ordering or persistence. Record unrun criteria rather than closing either phase on source inspection alone.

## Availability and evidence

| Capability / criteria | Availability | Evidence and limits — 2026-10-18 |
| --- | --- | --- |
| Existing access | Implemented; BA accepted development scope | No BA reopening; three selected staff/CSRF/revocation offline regressions pass |
| MN00-AC01 | Implemented; focused offline evidence | 15 denial cases prevent callback execution; real persistence not exercised |
| MN00-AC02 | Implemented; focused offline evidence | Public interface, role policies, safe scope, one shared opaque transaction and successful result/activity touch pass |
| MN00-AC03 | Implemented; scoped database evidence | V01/V02 pass on PostgreSQL 17.11: revocation-first denial and callback-first ordering with observed advisory-lock contention; latest report below |
| MN00-AC04 | Implemented; scoped database evidence | V03 passes: original consumer error preserved, callback transaction aborted, session activity rolled back and retained opaque scope invalid; latest report below |
| MN00-AC05 | Implemented; focused offline evidence | Public HTTP policy/proof/filter checks plus six existing HTTP regressions pass; no new production probe route |
| Menu / MN-AC01–06 | Source implemented; database unverified | Current MN-01 criterion evidence is below; no runtime Menu deployment or database contact |

### Checks and environment

- API TypeScript compile passed using existing tooling: from `apps/api`, `node node_modules/typescript/bin/tsc -p tsconfig.json --outDir dist/ba02-check --sourceMap false`. No production build/startup or database connection.
- Focused tests: from `apps/api`, `/Users/macbookpro/.nvm/versions/node/v24.18.1/bin/node --test tests/authorized-operation.test.mjs tests/access-http.test.mjs` — 27/27 pass, including 15 nested denial cases.
- Selected existing application regressions: same Node executable, `--test --test-name-pattern='staff lifecycle|CSRF proof, prelogin|revocation while admin hash' tests/access.test.mjs` — 3/3 pass. New test file is included in the existing `test:access` script for future routine execution; the full suite was not run.
- Initial launch using directory-resolved `node` selected v20.11.1; six HTTP checks passed but the new test file could not import the existing Node Argon2 adapter. Re-running explicitly with already-installed Node v24.18.1 passed. This is an environment limitation, not a proven implementation defect. No runtime installed or engine constraint changed.
- Repository requires Node >=24.21.0 <25. All new behavioral results above are on 24.18.1; declared-runtime compatibility remains unverified. Tests use doubles/injection only, never `.env`, a database, network listener or actual credential hashing.

## Handoff — 2026-10-18

- Delivered: source/offline evidence in `51b8fdb`, after accepted MN-00 checkpoint `d98b91e`; [bounded database procedure and harness](database-acceptance.md) now prepared, unrun.
- Current completion shape: protected catalogue maintenance/read and exact selection pricing; preparation adds manual gated PostgreSQL cases and fresh API process probes. No UI, Orders, tax, stock or payment behavior.
- Next action: user reviews the target, gates, migration, fixtures, observations and cleanup in the procedure, then separately authorizes its one execution. No installation, database access/migration, provisioning, deployment, push/PR/merge under preparation authority.
- Limits: migration still unapplied; persistence/restart, FK enforcement, Menu rollback and PostgreSQL concurrency acceptance remain unrun. MN-01 remains active, not complete/accepted. Reused clean `codex/menu-catalogue` checkout; no unrelated work present at entry.
- Incidents: none in this preparation. Existing incident reviews remain owned by the [incident log](../../../../../../../../docs/quality/agent-incidents.md); this does not close prior reviews.

## Verification preparation follow-up — 2026-10-18

User asked the agent to handle next steps. Read-only runtime inventory found nvm Node 24.18.1, system 20.11.1, pnpm 22.23.1 and app-bundled 24.19.0; none meets >=24.21.0 <25. No supported-runtime rerun, download, installation or database connection occurred. [Concrete bounded acceptance procedure](../../../../authentication/docs/features/access/mn00-acceptance.md) is prepared for review: one existing `.env` test target, read-only empty/schema/history gate, synthetic fixtures, two ordering cases, one rollback case, at most two connections, temporary probe relation and ledger-owned cleanup. New reports must preserve historical BA evidence. Runtime installation and target-specific execution remain pending authorization; MN-00 is still unaccepted. Incidents: none in this follow-up.

## Bounded execution authorization — 2026-10-18

User explicitly answered “yes” to installing a supported Node 24 runtime and running the three scoped checks against the existing `.env` test database, including synthetic fixtures, temporary probe table and run-owned cleanup, stopping if the database is nonempty or baseline differs. This supersedes the earlier installation/database prohibitions only for this procedure. No application migrations, new database/infrastructure, operator provisioning/recovery, deployment, Git mutations or MN-01 activation. Harness: `apps/api/tests/mn00-acceptance.mjs`, manual `MN00_ACCEPT_STAGING=YES` opt-in; [reviewed procedure](../../../../authentication/docs/features/access/mn00-acceptance.md).

Node v24.21.0 installed to `/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64` from the official archive, SHA-256 matched official SHASUMS before verified extraction. Compilation and the same 30 focused checks passed on v24.21.0. New harness syntax and missing-opt-in refusal checked before any database connection. Database results pending execution; no claim of acceptance.

## Verification result — 2026-10-18

Historical MN-00 execution evidence; user acceptance was subsequently recorded at MN-01 activation.

- Supported-runtime checks: Node 24.21.0 compilation and the same 30 focused tests/subtests passed; this supersedes the earlier runtime-version gap. No broader suite or production build run.
- [Passing database report](../../../../../../../../apps/api/tests/evidence/mn00.062f6e66-871f-4d22-b040-376c2ac0659d.json): empty-baseline/schema/history gates passed; V01/V02/V03 passed on PostgreSQL 17.11 with at most two connections. Actual advisory-lock contention observed; successful callback transaction status committed, failed callback transaction status aborted; session activity rollback and scope invalidation verified.
- Cleanup: run-owned synthetic application records removed; all ten application tables verified empty, pools closed. No application migrations/schema changes or operator provisioning CLI.
- Three earlier unsuccessful V02 harness runs also passed their baseline gates and application cleanup; reports retained under their unique MN-00 run IDs. Observer instrumentation and transaction-local probes were refined before the passing run. Earlier coarse sanitized diagnostics do not establish exact initial causes; retry success alone is not root-cause proof.
- Report source hashes match current source. Harness requires explicit opt-in; no new production route. Supported runtime remains isolated at `/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64`; shell defaults/dependency versions were not changed.
- Verification work stops here per user direction. No additional test expansion. Explicit user acceptance remains the only MN-00 closure gate.

## MN-00 acceptance and MN-01 activation — 2026-10-18

User explicitly accepted MN-00 under its recorded development scope and approved the linked MN-01 specification/MN-D01–06 decisions. MN-00 is complete; historical reports remain unchanged. MN-01 source, affected documentation and focused existing offline checks are authorized. No installation, database access, migration execution, provisioning, deployment or Git mutations/PR actions. Earlier bounded MN-00 execution permission is not inherited.

Active task: MN-01-T01 — protected catalogue/selection API (MN-AC01–06); source implementation active. Solo ownership: Menu source, offline migration artifacts, HTTP composition/schema re-export, focused tests/test script and affected docs. Preserve pre-existing staged/unstaged work. Database-dependent acceptance remains unrun; source/offline checks cannot close MN-01.

Concrete contract before source: complete item/combo definitions; server-assigned nested IDs, retained variant identities, per-offering expected revision; decimal strings with persisted currency/scale. Store one definition aggregate plus a variant identity index and combo-reference edges with ownership foreign keys, not a generic settings engine. One business-scoped SELECT returns a coherent bounded catalogue snapshot. MN-00 serializes every write and resolution POST; ordinary GET reuses existing authenticated context reads. HTTP paths: GET/POST `/api/v1/menu/offerings`, GET/PUT `/offerings/:id`, POST `/offerings/:id/deactivate`, POST `/resolve`; inactive inspection uses separate administrator-only GET `/definitions` and `/definitions/:id`. Technical limits: 500 offerings/business, 32 variants/item, 8 groups/offering, 32 options/group, quantities 1–1000, labels 1–120 characters, prices up to nine integer digits and standard currency fraction digits (0–4). Keep complete request bodies within the existing 16 KiB transport limit. Reject empty combos, inactive required dependencies and invalid nested identities atomically. Standard currency precision is persisted and checked against current configuration/metadata rather than silently changing interpretation.

## MN-01 source evidence — 2026-10-18

Scope is approved; source implementation delivered, database acceptance pending. User-approved currency revision: replace Intl-derived precision with a checked-in standard registry after Node 24.21.0 reported PKR=0. [MN-D05](decisions.md#mn-d05--money-and-input-defaults) owns the resolution and data provenance; standard registry sets PKR=2, JPY=0, KWD=3. Stored scale/currency mismatch fails closed.

| Criteria | Evidence | Limit |
| --- | --- | --- |
| MN-AC01a/c/d, AC02a/b, AC03a–d | Six focused [rule/application tests](../../../../../../tests/menu.test.mjs) pass, covering sizes/extras, exact currency precision, fixed/selectable 1/1 and 2/2 combos, reconfiguration, stale edits, inactive dependencies and scoped snapshots | Application store is an offline double; no real save/restart or schema claim |
| MN-AC04a/b | Two [Menu HTTP tests](../../../../../../tests/menu-http.test.mjs) pass with actual controller, guard/filter, MN-00 AccessService and offline stores; admin/staff/inactive restrictions, CSRF/origin, grant/forced-change/revocation and input denials observed | No browser, real sessions/persistence or deployment |
| MN-AC05a/b | Sequential same-offering stale and unrelated-offering edit behavior checked offline | Concurrent PostgreSQL execution unrun |
| MN-AC05c/d/e, AC01b | Source uses one SELECT snapshot, MN-00 locked writes, CAS revision updates and one transaction; failed-write double observation preserves state | Actual Menu rollback, dependency/save races, mixed-read races and restart persistence unrun |
| MN-AC06 | Pending user acceptance | Offline checks cannot close the increment |

Commands used with existing `/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node`: compile `apps/api/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --outDir apps/api/dist/menu-check --sourceMap false`, then from `apps/api` `--test tests/menu.test.mjs tests/menu-http.test.mjs` — 8/8 pass. No broader suites or repeated checks after success. `test:menu` added to existing package scripts for future use.

Existing Drizzle Kit generated offline SQL/snapshot/journal artifacts for `0003_menu_catalogue`; they were not executed and no `.env` was loaded. New schema adds Menu-owned offerings, variant identities and reference edges, with scope/ownership FKs and per-offering revisions. No dependency additions or lockfile changes. Source placement/composition reviewed; 99 local links/anchors across nine documents, new-source whitespace checks and `git diff --check` passed. Offline migration/journal/snapshot review confirms three new tables and three ownership FKs only; SQL remains unexecuted.

## Local contribution checkpoints — 2026-10-18

User instructed work according to updated CONTRIBUTING.md after authorizing/pulling the two remote workflow commits. This permits local branch/commit work, superseding earlier no-Git restrictions for these checkpoints only; no push, PR or merge authorization inferred. Reuse checkout `/Users/macbookpro/Documents/personal/restaurant-pos-custom` on `codex/menu-catalogue`, based on synchronized `main` at `9c7b565`; solo integration owner is primary agent. No worktree needed: all remaining changes belong to this dependent Menu/access delivery.

Commit boundaries: accepted MN-00 authorization source/tests/sanitized evidence and its own docs first; MN-01 catalogue source/migration/contracts/offline tests and integrated handoff docs second. No executable changes during checkpoint preparation, so reuse recorded focused checks. Review staged content and whitespace; retain unapplied Menu migration and pending database/user acceptance limits. Staged environment/private-key/credential URL and secret-field review found no matching secret content; this is a scoped review, not a general secret-detection guarantee. No incident identified in contribution preparation.

MN-00 local checkpoint committed as `d98b91e` (`feat(auth): support transactional consumer authorization`). Its documentation is self-contained; this dependent Menu checkpoint links the integrated tracker and restores the Menu test script. Executable source and recorded verification results were not changed during commit preparation.

## Database acceptance preparation — 2026-10-18

User explicitly authorized the smallest bounded MN-01 database acceptance procedure/harness, affected docs, necessary focused offline checks and Conventional Commit local checkpoints. No installation, database access, migration execution, provisioning, deployment, push, PR or merge. Solo primary agent owns preparation in the existing checkout on `codex/menu-catalogue`; inspected clean baseline at `51b8fdb` with preceding `d98b91e`. No worktree or delegation needed.

| Acceptance-linked task | Status | Evidence / remaining gate |
| --- | --- | --- |
| Prepare persistence/restart, rollback, dependency/edit concurrency and coherent reads (AC01b, AC05a–e) | complete; preparation only | [Reviewable target/procedure](database-acceptance.md), [manual harness](../../../../../../tests/mn01-acceptance.mjs) and [fresh API probe](../../../../../../tests/mn01-restart.mjs) |
| Execute bounded acceptance | pending authorization; unrun | Initial gate expects empty prior ten tables/history 0000–0002 on the same fingerprint as MN-00; applies only 0003; leaves schema/history applied and cleans run-owned fixtures |
| MN-AC06 acceptance | pending | User review of actual evidence and explicit acceptance required |

Preparation checks on existing isolated Node 24.21.0: syntax checks for both new scripts; four refusal subprocesses (each script without opt-in and without target acknowledgement), all rejected before configuration/import/connection; offline validation of actual fixture builders and both injected-rollback edit shapes against existing compiled domain rules. These targeted checks address new harness paths; no passing Menu/MN-00 suites were repeated. No `.env` loaded, dependencies installed, compilation or database execution performed during preparation. Documentation links and whitespace reviewed before checkpoint. Harness runtime behavior, timeout/lock observations, migration application and cleanup remain unverified until separately authorized execution.

Next authorization is exactly the one-run scope in [the procedure](database-acceptance.md#proposed-execution-commands--require-new-authorization); empty exclusive disposable target confirmation is required because migration and fixture writes exceed preparation permission. Retain unapplied migration status and pending acceptance. Incidents: none in this preparation; no skill/template/guardrail changes.
