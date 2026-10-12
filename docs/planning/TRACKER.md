# Global phase tracker

## Current focus

- Stage: Foundation F-01 remains complete; [acceptance and evidence limits](project-foundation/phase-tracker.md#closeout--2026-10-12).
- Approved topology: one business per LAN installation, dedicated local PostgreSQL, locally served client assets and one maintained codebase; explicit user approval on 2026-10-12. [Decision and rationale](../architecture/vendor-isolation-proposal.md).
- Current activity: BA-01 closed after authorized staging acceptance on 2026-10-12; next is BA-02 decision review/planning. [Owning tracker](business-access/phase-tracker.md), [Business/Branch spec](../../apps/api/src/modules/business/docs/features/foundation/spec.md), [Authentication/Access spec](../../apps/api/src/modules/authentication/docs/features/access/spec.md).
- Current phase: BA-01 complete; no active implementation phase. BA-D01/BA-D02/BA-D05 approved; BA-02/BA-03 inactive and remaining decisions open.
- Deferred validation remains in the [canonical foundation handoff](project-foundation/phase-tracker.md#current-handoff--2026-10-12) and [acceptance record](../acceptance/project-foundation.md).

## Current planning handoff — 2026-10-12

User approved the topology and subsequently authorized BA-01-T01/T02 implementation with BA-D01/BA-D02/BA-D05. Authorization, task IDs, evidence and checkout cautions are owned by the [joint phase tracker](business-access/phase-tracker.md#ba-01-authorization--2026-10-12). Necessary dependency installation is authorized but was not needed. Subsequent user-authorized staging writes/migration acceptance completed successfully; [BA-01 closeout](business-access/phase-tracker.md#closeout--2026-10-12) records evidence. Infrastructure provisioning, deployment and later phases remain unauthorized.

Next action: review BA-02 decisions BA-D03/BA-D04/BA-D06 and the authentication design before implementation authorization. Preserve staged workflow changes and unrelated work. Foundation F-01 is not reopened.

## Proposed foundation follow-ups — 2026-10-12

User requested application versioning and consideration of Swagger documentation and other necessary project foundations. Recorded for planning; no implementation phase activated and accepted F-01 scope remains closed.

- Versioning is requested; clarify whether this means release/build identification, HTTP API compatibility versioning, or both. Proposed direction: identify deployed releases for support/migration compatibility and define API compatibility policy before the first business API consumer. Exact version format, route/header strategy and backward-compatibility commitment remain unapproved; do not introduce parallel API versions without a consumer need.
- Swagger/OpenAPI is a candidate for documenting business HTTP contracts and authentication, with documentation exposure decided explicitly for each environment. OpenAPI UI remains a recorded F-01 P1 deferral, not a failed foundation requirement. Reassess priority with the first business API/integration specification; generated documentation alone does not verify behavior.
- Review other foundations against concrete workflows and existing capabilities before proposing scope: request validation, consistent errors, secret-safe diagnostics, access controls and focused CI checks. This is a discovery list, not approval for packages, custom frameworks or a generic industry-standard checklist. Distinguish required behavior from optional tooling and avoid duplicating framework capabilities.

Next planning treatment: resolve the versioning meaning and propose the smallest justified follow-up scope with acceptance outcomes. These items do not select vendor isolation or alter the foundation’s canonical deferred verification limits.

## Module roadmap

Project foundation precedes Business/Branch and Authentication/Access, which precede Menu. Detailed increments and later module ordering remain proposed; this roadmap does not authorize implementation. The business foundation is branch-aware with one operational branch per business in MVP. Integration milestones remain required even when modules are developed separately.

| Order | Module | Status | Active phase / plan |
| --- | --- | --- | --- |
| 0 | Project foundation | complete | [Specification](project-foundation/spec.md) / [phase tracker](project-foundation/phase-tracker.md); development foundation accepted; limits recorded |
| 1 | Business/Branch foundation | proposed | [Specification; BA-01 slice approved](../../apps/api/src/modules/business/docs/features/foundation/spec.md) / [joint tracker](business-access/phase-tracker.md); BA-01 accepted on staging; later lifecycle/access work inactive |
| 2 | Authentication and Access | proposed | [Specification; BA-01 slice approved](../../apps/api/src/modules/authentication/docs/features/access/spec.md) / [joint tracker](business-access/phase-tracker.md); BA-01 accepted on staging; later lifecycle/access work inactive |
| 3 | Menu | proposed | Follows accepted foundation; plan pending |
| 4 | Orders | proposed | Not activated |
| 5 | Kitchen | proposed | Not activated |
| 6 | Billing and payments | proposed | Not activated |
| 7 | Cashier shifts | proposed | Not activated |
| 8 | Inventory | proposed | Stock model unresolved |
| 9 | Reports | proposed | Not activated |

## Integration and release objectives

- First milestone: accept business/branch provisioning and staff authentication/access together, including unauthorized business/branch access rejection and disabled-account behavior. Proposed scenarios are in the linked joint specifications; specification approval and user-run acceptance remain pending.
- After minimum Orders, Kitchen and Billing capabilities exist: accept one complete trading flow, including amendments, reconnect and receipt output.
- Before MVP release: reconcile approved menu behavior, payments, shifts, stock and reports; verify recovery and repeatable isolated business provisioning.
- Detailed checklists remain deferred until the relevant modules enter discovery.
