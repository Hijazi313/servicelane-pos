# Billing/Payments — phase tracker

Parent: [global tracker](../TRACKER.md). Plan: [README](README.md). Specification: [spec](spec.md). Decisions: [decisions](decisions.md).

Status: revised BP-00 multiple-rule design complete for review; sample development approved; design acceptance/source permission pending. Active implementation phase: none. Coordinator: primary agent; [read-only reviews](agent-collaboration.md).

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
| BP-00: resolve scope/business decisions and concrete contracts | Revised design complete for review; awaiting acceptance | Sample development approved; multiple taxes/charges and seven updated contracts defined; no BP-01 activation |
| BP-01: approved source/offline delivery | Proposed; inactive | Criteria BP-A01–18 mapped to focused offline evidence with persistence gaps explicit; no database run or user acceptance inferred |
| BP-02: bounded persistence verification | Proposed objective; inactive | Later reviewed target-specific procedure and renewed disposable/exclusive reservation; concurrency/rollback/fresh-process/owned cleanup evidence; separate user acceptance |

## Current handoff

Revised BP-00 multiple-tax/charge settings and seven HTTP contracts complete for review. [Canonical contract](spec.md#bp-00-http-contracts--2026-10-26) covers strict bounded rule definitions, net/shared bases, included-tax allocation, charge selection, revision/retry identity, expanded exact breakdowns and BP-A01–18. [BP-D09](decisions.md#bp-d09--bounded-multiple-taxes-and-charges--2026-10-26) records the user-authorized scope revision and now-approved sample development values. Do not repeat the prior unresolved-mode request.

Next action: owner accepts the bounded revised design and authorizes source/offline work below. No technical-policy blocker remains for that development scope; actual fiscal applicability, production configuration, excluded tax workflows and operating/release gates remain unresolved before restaurant use. Primary-only documentation/Git; all source phases inactive. Seven ledgers, accepted Orders/Kitchen reports/scope and pending incident reviews unchanged.

Exact requested implementation authorization, **not granted by this plan**:

> Accept the revised BP-00 multiple-tax/charge contracts and authorize BP-01 source implementation for the seven specified routes, finite eight-tax/eight-charge configuration, exact included/exclusive calculation/allocation, automatic/optional per-order charges, immutable cash settlement and selection-sensitive retries; narrow Orders financial/Business display interfaces, matching Nest exports, owned history/storage and migration source without execution; affected documentation and focused offline BP-A01–18 checks with the already-approved synthetic samples; local Conventional Commits. Isolate samples to offline fixtures; do not activate live settlement or install sample policy defaults. Preserve accepted upstream contracts/evidence, seven ledgers and pending incident reviews. No installation, environment/database access, migration execution, accepted Orders/Kitchen reruns, publication/PR/merge, deployment, real operation or BP-02 activation. Stop for material unsupported rules or changed cross-module contracts.

Separate future permissions: BP-02 preparation/execution, development acceptance, publication/integration and operational/release validation. Existing upstream execution permissions do not transfer.

Incidents: none in this planning task. [Existing incident reviews](../../quality/agent-incidents.md) preserved: 21 entries remain pending user review at closeout, including corrected entries; module-closeout review point reached, no closure or prevention-policy approval inferred. No incident/skill/guardrail edits made.

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
