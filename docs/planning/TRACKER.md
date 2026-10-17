# Global phase tracker

## Current focus

- Stage: Foundation F-01 remains complete; [acceptance and evidence limits](project-foundation/phase-tracker.md#closeout--2026-10-12).
- Approved topology: one business per LAN installation, dedicated local PostgreSQL, locally served client assets and one maintained codebase; explicit user approval on 2026-10-12. [Decision and rationale](../architecture/vendor-isolation-proposal.md).
- Current activity: BA-01 closed after authorized staging acceptance on 2026-10-12; BA-02 is complete and user-accepted on 2026-10-17 under revised development scope. [Owning tracker](business-access/phase-tracker.md), [Business/Branch spec](../../apps/api/src/modules/business/docs/features/foundation/spec.md), [Authentication/Access spec](../../apps/api/src/modules/authentication/docs/features/access/spec.md).
- Current phase: BA-01 complete; BA-02 complete under [user acceptance](business-access/phase-tracker.md#ba-02-acceptance--2026-10-17); BA-D01–06 approved; BA-03-T01 complete and [user-accepted](business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) under its revised development scope; two-database execution deferred, unrun.
- Deferred validation remains in the [canonical foundation handoff](project-foundation/phase-tracker.md#current-handoff--2026-10-12) and [acceptance record](../acceptance/project-foundation.md).

## Current planning handoff — 2026-10-12

User approved the topology and subsequently authorized BA-01-T01/T02 implementation with BA-D01/BA-D02/BA-D05. Authorization, task IDs, evidence and checkout cautions are owned by the [joint phase tracker](business-access/phase-tracker.md#ba-01-authorization--2026-10-12). Historical BA-01 installation permission was not needed; BA-02 installation is prohibited. Subsequent user-authorized staging writes/migration acceptance completed successfully; [BA-01 closeout](business-access/phase-tracker.md#closeout--2026-10-12) records evidence. BA-02 source is authorized under its own record; database execution is limited to the separately recorded 2026-10-17 staging verification authorization; infrastructure provisioning/deployment and BA-03 remain unauthorized.

Current handoff: [BA-03 accepted and closed](business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) by explicit user instruction on 2026-10-17. Accepted development evidence and its limits are retained; actual two-database execution is deferred, unrun, to separately authorized installation/provisioning validation. BA-02's separate release checks remain unchanged. Current authorization: complete BA-03 Git flow only. Next module planning will happen in a new chat; no Menu plan or implementation is included. No new test execution, database access, infrastructure or deployment. Preserve historical evidence.

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
| 3 | Menu | proposed | Follows accepted foundation; plan pending |
| 4 | Orders | proposed | Not activated |
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
