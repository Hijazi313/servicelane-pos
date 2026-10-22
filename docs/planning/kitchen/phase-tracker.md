# Kitchen handoff — phase tracker

Date: 2026-10-22. Owner: primary agent, solo. [Specification](spec.md); [business decisions](decisions.md); [global tracker](../TRACKER.md).

Status: proposed. Active implementation phase: none. KT-00 planning deliverable is complete and KT-D01–04 business boundaries are approved; the technical specification remains proposed for review, and source authorization is pending.

## Authorization and verified entry

User requested the smallest justified Kitchen increment and Orders handoff, P0 scope, acceptance criteria, phases and options, starting from accepted OR-01. Authorization: planning/documentation and standing GitHub workflow for completed documentation only. No implementation, database access, test reruns, installation, provisioning, deployment or later phase activation. Publishing a proposal does not approve its business rules. Merge permission remains separate from push/PR publication under CONTRIBUTING.

Local main and remote main both verified at `6125da43245f50f52730d122792f7d01418f013a` on 2026-10-22. OR-01 is accepted/closed; [canonical upstream closeout](../../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md#acceptance-and-closeout--2026-10-21) retains historical evidence/limits. Reused checkout; topic `codex/kitchen-planning`, base `6125da4`, primary agent owns documentation integration. No unrelated tracked modifications at entry. Both local Menu/Orders ledgers remain untracked/excluded; pending incident reviews remain unchanged.

## Phases and gates

| Phase | Outcome / status | Entry and exit |
| --- | --- | --- |
| KT-00 — planning | Complete: documentation prepared and KT-D01–04 resolved | Entry: current request. Exit met for business planning: owner resolved KT-D01–04. Technical review is now delivered below; owner approval of the revised specification remains separate from implementation authorization. |
| KT-01 — backend handoff | Proposed, not activated | Entry: approved decisions/spec plus explicit source/check authorization. Intended outcome: KT-A01–06, one transaction-aware Orders projection, trusted Authentication actor-scope extension and Kitchen ticket/queue/status boundary. Before coding, confirm contracts, bounds, revision/retry semantics and capability upkeep; no standalone Orders reopening or unrelated fixes. Exit: authorized source/offline evidence recorded, unavailable persistence behavior explicit. |
| KT-02 — bounded integration acceptance | Proposed, not activated | Entry: reviewed procedure for current post-0004 baseline, explicit target/run/fixture/cleanup permission and acceptable source evidence. Objective: persisted atomicity/concurrency and fresh-process KT-A01–05 evidence; explicit user development acceptance remains separate from technical checks/integration. No old Menu/Orders harness rerun or inherited target permission. |

No later phase is detailed or activated. If payment-first or amendments/cancellation are required in the first slice, revise KT-01 prerequisites and criteria before source authorization; do not silently expand this plan.

## Current planning tasks

| Task | Status / evidence |
| --- | --- |
| Verify accepted Orders entry, checkout and preservation | Complete by Git/source/document inspection; no behavioral rerun |
| Challenge phase P0 and specify acceptance | Prepared in [specification](spec.md#outcome-and-smallest-justified-scope) and [criteria](spec.md#acceptance-criteria); proposed, not approved |
| Present material business alternatives | Prepared in [KT-D01–04](decisions.md); KT-D01–04 approved for development; future configuration mechanism remains proposed |
| Publish coherent documentation | [PR #13](https://github.com/Hijazi313/servicelane-pos/pull/13) open against main; no merge or additional business approval inferred |

## Completion shape and evidence limits

This planning increment provides a reviewable conditional backend scope and a narrow Orders-owned handoff design. It provides no Kitchen API, schema, migration, queue, dispatch or status implementation. Existing Orders capture/readback and its accepted evidence are unchanged. All KT-A01–06 behavior is unavailable; source inspection of upstream contracts is not proof of Kitchen behavior. No tests, database access or installation performed. Documentation links/diff and ledger preservation are the only task verification. Existing automatic GitHub test/install workflow must not be used to bypass this task's no-rerun/no-install boundary; use a skip-CI documentation commit and report missing checks, without claiming integration complete.

## Current handoff

Next action: review the proposed technical specification and explicitly authorize KT-01 source scope/checks if desired. [KT-D01–04](decisions.md#approval-record) are resolved for development; retain operational limits and defer configurable modes. Technical review is complete under the authorization below; obtain specification approval and source permission without assuming either from publication. No implementation begins until material decisions and explicit authorization are present.

Changed files: this planning trio, global tracker, short Orders transition, project-scope authorization link and affected module summary. Preserve `apps/api/tests/evidence/mn01.50780479-e373-4388-ba18-3ec6da8e4f20.ledger.json` and `apps/api/tests/evidence/or01.2b001f56-d609-434b-a3a3-dd7a372b5eca.ledger.json` unchanged/untracked. Pending incident review remains with the user; [incident log](../../quality/agent-incidents.md) is unchanged. Incidents: none in this planning work; 15 existing entries remain pending user review (including linked process/technical entries; no new independent-occurrence count implied).


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
| Kitchen dispatch/queue/transitions/schema and HTTP | proposed | KT-A01–06; offline transactional double and actual HTTP checks; no PostgreSQL claim |
| Migration source, capability/docs upkeep and closeout | proposed | Generated offline migration only; scoped compilation/boundary checks and recorded limits |

Completion shape: source/offline-verified backend API with persistence implementation unverified on PostgreSQL; no operational readiness or development acceptance inferred.

Prerequisite checkpoint: fresh compilation, 16 Orders/projection/actual-HTTP checks and six focused authorization checks passed on existing Node 24.21.0. Projection retains captured composition and instructions while stripping nested surcharges/customer data; supplied transaction and verified actor are covered. No database access; PostgreSQL behavior remains unverified.
