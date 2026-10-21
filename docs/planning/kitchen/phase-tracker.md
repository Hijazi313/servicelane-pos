# Kitchen handoff — phase tracker

Date: 2026-10-22. Owner: primary agent, solo. [Specification](spec.md); [business decisions](decisions.md); [global tracker](../TRACKER.md).

Status: proposed. Active implementation phase: none. Planning deliverable is prepared; KT-D02–04 are approved for the development boundary; KT-D01 and acceptance of the full plan remain pending.

## Authorization and verified entry

User requested the smallest justified Kitchen increment and Orders handoff, P0 scope, acceptance criteria, phases and options, starting from accepted OR-01. Authorization: planning/documentation and standing GitHub workflow for completed documentation only. No implementation, database access, test reruns, installation, provisioning, deployment or later phase activation. Publishing a proposal does not approve its business rules. Merge permission remains separate from push/PR publication under CONTRIBUTING.

Local main and remote main both verified at `6125da43245f50f52730d122792f7d01418f013a` on 2026-10-22. OR-01 is accepted/closed; [canonical upstream closeout](../../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md#acceptance-and-closeout--2026-10-21) retains historical evidence/limits. Reused checkout; topic `codex/kitchen-planning`, base `6125da4`, primary agent owns documentation integration. No unrelated tracked modifications at entry. Both local Menu/Orders ledgers remain untracked/excluded; pending incident reviews remain unchanged.

## Phases and gates

| Phase | Outcome / status | Entry and exit |
| --- | --- | --- |
| KT-00 — planning | Documentation prepared; decision gate pending | Entry: current request. Exit: owner explicitly resolves remaining KT-D01 and confirms KT-D02–04 scope, accepts conditional scope/criteria or requests rescope; no implementation implied. |
| KT-01 — backend handoff | Proposed, not activated | Entry: approved decisions/spec plus explicit source/check authorization. Intended outcome: KT-A01–06, one Orders projection and Kitchen ticket/queue/status boundary. Before coding, confirm contracts, bounds, revision/retry semantics and capability upkeep; no standalone Orders reopening or unrelated fixes. Exit: authorized source/offline evidence recorded, unavailable persistence behavior explicit. |
| KT-02 — bounded integration acceptance | Proposed, not activated | Entry: reviewed procedure for current post-0004 baseline, explicit target/run/fixture/cleanup permission and acceptable source evidence. Objective: persisted atomicity/concurrency and fresh-process KT-A01–05 evidence; explicit user development acceptance remains separate from technical checks/integration. No old Menu/Orders harness rerun or inherited target permission. |

No later phase is detailed or activated. If payment-first or amendments/cancellation are required in the first slice, revise KT-01 prerequisites and criteria before source authorization; do not silently expand this plan.

## Current planning tasks

| Task | Status / evidence |
| --- | --- |
| Verify accepted Orders entry, checkout and preservation | Complete by Git/source/document inspection; no behavioral rerun |
| Challenge phase P0 and specify acceptance | Prepared in [specification](spec.md#outcome-and-smallest-justified-scope) and [criteria](spec.md#acceptance-criteria); proposed, not approved |
| Present material business alternatives | Prepared in [KT-D01–04](decisions.md); KT-D02–04 approved; KT-D01 pending |
| Publish coherent documentation | [PR #13](https://github.com/Hijazi313/servicelane-pos/pull/13) open against main; no merge or additional business approval inferred |

## Completion shape and evidence limits

This planning increment provides a reviewable conditional backend scope and a narrow Orders-owned handoff design. It provides no Kitchen API, schema, migration, queue, dispatch or status implementation. Existing Orders capture/readback and its accepted evidence are unchanged. All KT-A01–06 behavior is unavailable; source inspection of upstream contracts is not proof of Kitchen behavior. No tests, database access or installation performed. Documentation links/diff and ledger preservation are the only task verification. Existing automatic GitHub test/install workflow must not be used to bypass this task's no-rerun/no-install boundary; use a skip-CI documentation commit and report missing checks, without claiming integration complete.

## Current handoff

Next action: owner resolves [KT-D01](decisions.md#approval-record), choosing first-slice dispatch/payment eligibility and configuration scope. KT-D02–04 are approved as a development boundary; retain their operational limits. Record answers without inferring source permission; adjust scope if needed. No implementation begins until material decisions and explicit authorization are present.

Changed files: this planning trio, global tracker, short Orders transition, project-scope authorization link and affected module summary. Preserve `apps/api/tests/evidence/mn01.50780479-e373-4388-ba18-3ec6da8e4f20.ledger.json` and `apps/api/tests/evidence/or01.2b001f56-d609-434b-a3a3-dd7a372b5eca.ledger.json` unchanged/untracked. Pending incident review remains with the user; [incident log](../../quality/agent-incidents.md) is unchanged. Incidents: none in this planning work; 15 existing entries remain pending user review (including linked process/technical entries; no new independent-occurrence count implied).
