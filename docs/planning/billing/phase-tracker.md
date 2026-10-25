# Billing/Payments — phase tracker

Parent: [global tracker](../TRACKER.md). Plan: [README](README.md). Specification: [spec](spec.md). Decisions: [decisions](decisions.md).

Status: BP-00 contract design complete for review; blocked on fiscal development-mode decision/acceptance before source entry. Active implementation phase: none. Coordinator: primary agent; [read-only reviews](agent-collaboration.md).

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
| Planning: verify entry and define smallest candidate | Complete | Entry inspection above; [BP-R01–06 and BP-A01–14](spec.md#acceptance-criteria), boundaries and decision recommendations documented |
| BP-00: resolve scope/business decisions and concrete contracts | Blocked on owner fiscal-mode decision/acceptance; contract design complete | BP-D01–06 recommendations approved; seven exact contracts/review reconciled; mode unresolved, no BP-01 activation |
| BP-01: approved source/offline delivery | Proposed; inactive | Criteria BP-A01–14 mapped to focused offline evidence with persistence gaps explicit; no database run or user acceptance inferred |
| BP-02: bounded persistence verification | Proposed objective; inactive | Later reviewed target-specific procedure and renewed disposable/exclusive reservation; concurrency/rollback/fresh-process/owned cleanup evidence; separate user acceptance |

## Current handoff

BP-00 settings and seven HTTP contract designs complete for review. Three independent read-only reviews reconciled; [canonical contracts](spec.md#bp-00-http-contracts--2026-10-26) define typed inputs/outputs, validation, access/CSRF, limits, semantic errors, shared wiring, revisions/replay, money and acceptance BP-A01–14. BP-D01–06 development recommendations remain approved; no tax rule/mode/source approval inferred. Local-only branch; publication unauthorized. Upstream accepted evidence, seven ledgers and pending incident reviews unchanged.

One decision request: choose confirmed actual fiscal policy versus explicitly synthetic-only source/offline development with operational settlement disabled (recommended while actual rules are unresolved). Then approve the completed contract design and bounded source scope below; do not repeat settled BP-D01–06 approvals. No independent technical-contract blocker remains after review. BP-00 is not marked accepted/complete while its material fiscal-mode gate is unresolved.

Exact requested implementation authorization, **not granted by this plan**:

> Accept the BP-00 settings/HTTP contract design and record the selected fiscal development mode: [confirmed actual policy and applicability, or explicitly synthetic-only source/offline development with operational settlement disabled]. Authorize BP-01 source implementation for the seven specified routes: nonpersistent assessment, atomic full cash settlement, known-order readback, Billing policy administration and narrow Business display administration; the narrow Orders financial and Business display public interfaces with matching Nest exports; owned configuration/history/settlement storage and migration source generation/review without execution; affected documentation relocation/upkeep; focused existing offline checks and meaningful new BP-A01–14 cases; local Conventional Commits on the suitable topic branch. For synthetic-only mode, isolate synthetic values to offline fixtures and do not activate live settlement; make that source/wiring boundary explicit before edits. Preserve accepted Orders/Kitchen contracts/evidence and all seven ledgers. No installation, environment/database access, migration execution, accepted Orders/Kitchen reruns, push/PR/merge, deployment, operational use or BP-02 activation. Stop for a material unresolved policy or changed cross-module contract.

Separate future permissions: BP-02 preparation/execution, development acceptance, publication/integration and operational/release validation. Existing upstream execution permissions do not transfer.

Incidents: none in this planning task. [Existing incident reviews](../../quality/agent-incidents.md) preserved: 21 entries remain pending user review at closeout, including corrected entries; module-closeout review point reached, no closure or prevention-policy approval inferred. No incident/skill/guardrail edits made.

## Settings definition — 2026-10-26

Historical settings checkpoint; the subsequent contract-planning result below supersedes its next-action wording.

User authorized defining the exact recommended settings/defaults. Completed documentation: typed tax policy, no assumed fiscal values, explicit calculation/rounding rules, existing Business display settings, administrator authorization, revision/history, settlement snapshots and BP-A08–10. Actual tax rules and synthetic-only runtime mode remain undecided; implementation inactive. Source-scope additions and ownership refinement are recorded in BP-D07.

Completion shape: reviewable settings specification, not runnable configuration. Next: complete BP-00 concrete contracts and confirm fiscal development mode before source entry. Only documentation links/diff/whitespace reviewed; no tests, build, environment/database access, installation or publication. Accepted Orders/Kitchen evidence, seven ledgers and incident reviews preserved. Incidents: none this task; existing 21 pending reviews unchanged.

## BP-00 contract-planning authorization and result — 2026-10-26

User explicitly authorized completion of Billing contract documentation with three independent read-only sub-agents, primary-only writes/Git, and local focused commits. Verified checkout `codex/billing-planning` at `e936bdc`, tracked clean, only the seven preserved untracked ledgers; existing integration base remains `d75ac92`. No rebase/merge/fetch/source action required or inferred. [Assignments](agent-collaboration.md) record shared-checkout ownership and restrictions.

| Review / evidence | Result and reconciliation |
| --- | --- |
| Settings/Business independent source review | No blocking contradiction after note-as-audit and tuple-wide display revision clarified; new Business operations/history/provider exports remain prerequisites |
| HTTP/shared wiring independent source review | No blocking contradiction after POST assessment selected using actual runAuthorized CSRF/session semantics; seven strict methods, views, error/size/recovery contracts defined |
| Money/retry/concurrency independent source review | No blocking contradiction; replay ordering, reset-policy precedence, coherent assessment ordering and singular cash aggregate/uniqueness clarified |
| Primary REST design checklist/diff/local-link/whitespace review | Design covers applicable checklist; no collection/pagination. Static document checks only; executed DTO/HTTP/type/serialization/DB evidence absent |

All required independent contract planning is delivered; remaining material gate is the one owner fiscal-mode decision above plus acceptance/source authorization. BP-01/BP-02 remain inactive. No test/build, dependency/runtime installation, environment/database access, migration, publication or deployment. No upstream scope reopened. Temporary runtime artifacts: none. Incidents: none in this work; 21 existing pending reviews preserved, no closure/prevention-policy change.
