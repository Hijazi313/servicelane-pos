# Global phase tracker

## Current focus

- Stage: Foundation F-01 remains complete; [acceptance and evidence limits](project-foundation/phase-tracker.md#closeout--2026-10-12).
- Approved topology: one business per LAN installation, dedicated local PostgreSQL, locally served client assets and one maintained codebase; explicit user approval on 2026-10-12. [Decision and rationale](../architecture/vendor-isolation-proposal.md).
- Current activity: Menu/MN-00/MN-01 accepted and integrated through [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9), squash `b09770e`. Orders OR-01 implementation/evidence is integrated through [PR #10](https://github.com/Hijazi313/servicelane-pos/pull/10), squash `2daeb6c`, under the user-requested workflow completion; [Orders phase tracker](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md) owns scope, progress and verification limits. Authorized OR-01 integration run passed all eight cases, including concurrency and two fresh API processes; cleanup verified fifteen empty application tables and migration 0004 remains applied. User explicitly accepted OR-01 on 2026-10-21 under the recorded backend development scope/evidence limits; [closeout](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md#acceptance-and-closeout--2026-10-21). No next phase, deployment or database rerun activated.
- Tooling review: user-authorized [HTTP boundary check](../../apps/api/scripts/README.md#github-actions-verification--2026-10-21) is published and exercised on GitHub; the separately authorized [Authentication repair](business-access/phase-tracker.md#remote-verification--2026-10-21) is pushed at ba72346 and both GitHub workflows pass (seven checker tests; 15 files, zero findings). Integrated through PR #10; exact-head PR checks and the merged main-branch check passed. OR-01 backend development acceptance is recorded in its owning tracker; release acceptance remains separate.
- Current phase: OR-01 complete and user-accepted under its recorded development scope; Kitchen remains proposed, not activated. BA-01 complete; BA-02 complete under [user acceptance](business-access/phase-tracker.md#ba-02-acceptance--2026-10-17); BA-D01–06 approved; BA-03-T01 complete and [user-accepted](business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) under its revised development scope; two-database execution deferred, unrun.
- Deferred validation remains in the [canonical foundation handoff](project-foundation/phase-tracker.md#current-handoff--2026-10-12) and [acceptance record](../acceptance/project-foundation.md).

## Current planning handoff — 2026-10-21

BA-01/02/03 accepted development scope and historical execution permissions are owned by the [joint BA tracker](business-access/phase-tracker.md). They do not authorize new Menu or database work.

Current handoff: Menu remains accepted/integrated through PR #9 (`b09770e`). Orders PR #10 is merged (`2daeb6c`) after the authorized PostgreSQL run and exact-head CI passed; local main was updated and remote Orders branch removed by GitHub. Orders source/offline and bounded persistence verification are delivered and explicitly user-accepted under the recorded development limits; [owning phase tracker](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md). Preserve both local Menu/Orders ledgers and pending incident reviews. Next action is planning-only authorization for the smallest justified Kitchen increment; no further database run or next-module implementation is activated. Acceptance closeout changes documentation only and follows standing GitHub workflow authorization.

## Proposed foundation follow-ups — 2026-10-12

User requested application versioning and consideration of Swagger documentation and other necessary project foundations. BA-D06 scope was subsequently approved for BA-02 source; accepted F-01 scope remains closed.

- Approved BA-D06 selects `/api/v1` for new business routes while retaining technical `/health`; one API version only. Separate semantic application version and immutable build identity are defined for later packaging, not a rollout claim. [Owning proposal](../../apps/api/src/modules/authentication/docs/features/access/spec.md#ba-d06--api-and-release-identification-swagger-boundary).
- Swagger generation/UI remains P1: explicit validated contracts and focused checks are sufficient for the current backend increment. No Swagger dependency or F-01 reopening is authorized. Exposure policy must be reviewed if later added.
- Review other foundations against concrete workflows and existing capabilities before proposing scope: request validation, consistent errors, secret-safe diagnostics, access controls and focused CI checks. This is a discovery list, not approval for packages, custom frameworks or a generic industry-standard checklist. Distinguish required behavior from optional tooling and avoid duplicating framework capabilities.

Versioning/documentation implementation follows the approved BA-D06 boundary; release packaging remains deferred. These items do not select vendor isolation or alter the foundation’s canonical deferred verification limits.

## Module roadmap

Project foundation precedes Business/Branch and Authentication/Access, which precede Menu. Detailed increments and later module ordering remain proposed; this roadmap does not authorize implementation. The business foundation is branch-aware with one operational branch per business in MVP. Integration milestones remain required even when modules are developed separately.

| Order | Module | Status | Active phase / plan |
| --- | --- | --- | --- |
| 0 | Project foundation | complete | [Specification](project-foundation/spec.md) / [phase tracker](project-foundation/phase-tracker.md); development foundation accepted; limits recorded |
| 1 | Business/Branch foundation | complete; development scope | [Specification; BA-01 slice approved](../../apps/api/src/modules/business/docs/features/foundation/spec.md) / [joint tracker](business-access/phase-tracker.md); BA-01 accepted on staging; BA-02/BA-03 accepted under revised development scope; release verification deferred |
| 2 | Authentication and Access | complete; development scope | [Specification; BA-01 slice approved](../../apps/api/src/modules/authentication/docs/features/access/spec.md) / [joint tracker](business-access/phase-tracker.md); BA-01 accepted on staging; BA-02/BA-03 accepted under revised development scope; release verification deferred |
| 3 | Menu | complete development scope; merged | [MN-00 → MN-01 plan](../../apps/api/src/modules/menu/docs/README.md); accepted, PR #9 squash `b09770e`; release limits retained |
| 4 | Orders | OR-01 complete; accepted backend development scope | [Specification](../../apps/api/src/modules/orders/docs/features/capture/spec.md) / [phase tracker](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md); bounded persistence verified; [acceptance/closeout](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md#acceptance-and-closeout--2026-10-21) |
| 5 | Kitchen | proposed | Not activated |
| 6 | Billing and payments | proposed | Not activated |
| 7 | Cashier shifts | proposed | Not activated |
| 8 | Inventory | proposed | Stock model unresolved |
| 9 | Reports | proposed | Not activated |

## Integration and release objectives

- First milestone: accept business/branch provisioning and staff authentication/access together, including unauthorized business/branch access rejection and disabled-account behavior. BA-01/BA-02 are accepted; BA-03 is user-accepted under its revised development scope, with actual two-installation execution deferred, unrun, to installation/provisioning validation.
- After minimum Orders, Kitchen and Billing capabilities exist: accept one complete trading flow, including amendments, reconnect and receipt output.
- Before MVP release: reconcile approved menu behavior, payments, shifts, stock and reports; verify recovery and repeatable isolated business provisioning.
- Detailed checklists remain deferred until the relevant modules enter discovery.
