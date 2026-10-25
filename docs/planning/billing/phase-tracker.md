# Billing/Payments — phase tracker

Parent: [global tracker](../TRACKER.md). Plan: [README](README.md). Specification: [spec](spec.md). Decisions: [decisions](decisions.md).

Status: proposed; planning task complete. Active implementation phase: none. Solo owner: primary agent.

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
| Planning: verify entry and define smallest candidate | Complete | Entry inspection above; [BP-R01–06 and BP-A01–10](spec.md#acceptance-criteria), boundaries and decision recommendations documented |
| BP-00: resolve scope/business decisions and concrete contracts | Proposed | BP-D01–06 recommendations approved; fiscal development mode unresolved; concrete contracts and explicit source authorization still required |
| BP-01: approved source/offline delivery | Proposed; inactive | Criteria BP-A01–10 mapped to focused offline evidence with persistence gaps explicit; no database run or user acceptance inferred |
| BP-02: bounded persistence verification | Proposed objective; inactive | Later reviewed target-specific procedure and renewed disposable/exclusive reservation; concurrency/rollback/fresh-process/owned cleanup evidence; separate user acceptance |

## Current handoff

Planning documents complete; BP-D01–06 recommendations approved for the bounded development scope by the user in this chat on 2026-10-25. Settings/defaults are now defined in the specification; concrete contracts, fiscal rules/synthetic-only mode and implementation authorization remain unresolved. Local-only topic checkpoint; publication unauthorized. Documentation review covers changed scope, relative links and whitespace only; no tests/builds, installation or database access. No accepted Orders/Kitchen work reopened or rerun. Module docs are intentionally not scaffolded before source entry; global module index links this proposal without claiming a capability.

Next action: choose actual fiscal policy versus explicitly synthetic-only development with operational settlement disabled, then authorize the bounded source scope below. Do not request repeat approval of BP-D01–06’s settled development recommendations. BP-00 contract completion must precede source edits; material unresolved choices stop dependent work.

Exact requested implementation authorization, **not granted by this plan**:

> Approve the proposed BP-01 full-cash development scope and record my answers to BP-D01–06, including approved fiscal policy or explicitly synthetic-only development with operational settlement disabled. Authorize completion of BP-00 concrete contracts, then BP-01 source implementation for assessment, atomic full cash settlement and known-order readback; the narrow Orders-owned financial projection/public provider; approved Billing settings/revision history and narrow Business display edit/projection; migration source generation/review without execution; affected documentation relocation/upkeep; focused existing offline checks and meaningful new focused cases; and local Conventional Commits on the suitable topic branch. Preserve accepted upstream behavior/evidence and all seven ledgers. No installation, database/environment access, migration execution, accepted Orders/Kitchen reruns, push/PR/merge, deployment, operational use or BP-02 activation. Stop for any material unresolved policy or changed cross-module contract.

Separate future permissions: BP-02 preparation/execution, development acceptance, publication/integration and operational/release validation. Existing upstream execution permissions do not transfer.

Incidents: none in this planning task. [Existing incident reviews](../../quality/agent-incidents.md) preserved: 21 entries remain pending user review at closeout, including corrected entries; module-closeout review point reached, no closure or prevention-policy approval inferred. No incident/skill/guardrail edits made.

## Settings definition — 2026-10-26

User authorized defining the exact recommended settings/defaults. Completed documentation: typed tax policy, no assumed fiscal values, explicit calculation/rounding rules, existing Business display settings, administrator authorization, revision/history, settlement snapshots and BP-A08–10. Actual tax rules and synthetic-only runtime mode remain undecided; implementation inactive. Source-scope additions and ownership refinement are recorded in BP-D07.

Completion shape: reviewable settings specification, not runnable configuration. Next: complete BP-00 concrete contracts and confirm fiscal development mode before source entry. Only documentation links/diff/whitespace reviewed; no tests, build, environment/database access, installation or publication. Accepted Orders/Kitchen evidence, seven ledgers and incident reviews preserved. Incidents: none this task; existing 21 pending reviews unchanged.
