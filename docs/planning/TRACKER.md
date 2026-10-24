# Global phase tracker

## API convention and skill — 2026-10-24

User authorized a separate main-based worktree/topic branch for the API convention, repository skill with supported metadata and AGENTS.md discovery link, plus focused skill validation. Assignment: solo documentation owner, `/Users/macbookpro/.codex/worktrees/rest-api-contracts/restaurant-pos-custom`, branch `codex/rest-api-contracts`, base local main `6eeb92b`. No API migration, CI enforcement, database access, installation, push/PR/merge or deployment inferred.

- [x] Canonical [API convention](../architecture/rest-api-convention.md), [skill](../../.agents/skills/rest-api-contracts/SKILL.md), metadata, enforcement reference and contract template prepared.
- [x] YAML frontmatter/UI metadata parsed and checked with Ruby Psych; local links and whitespace checks passed. Bundled quick_validate.py could not run because PyYAML is absent in both existing Python runtimes; no installation performed.
- [x] Independent read-only scenario evaluation: unsafe tenant/filter/cursor/unbounded-list proposals rejected; unrelated helper change preserved existing envelope/retry behavior; justified bounded offset admin list allowed without recommendations. These are agent behavior observations, not API/runtime proof. Offset response metadata remains endpoint-defined.
- Incidents: none in this increment. Existing incident reviews remain separate.
- User subsequently authorized PR publication only; merge and current feature-branch sorting await explicit confirmation. Next: owner reviews the PR; CI enforcement remains a separate focused increment.

## API type-safety reference — 2026-10-24

User authorized a new topic branch and the type-safety reference discussed in this chat. Solo owner, current checkout, branch `codex/api-type-safety` from main `d77d653`; Kitchen source commits remain on `codex/kitchen-handoff`, and both untracked evidence ledgers are preserved. Scope: canonical requirements, example reference, skill routing/metadata version and enforcement limitations. No runtime code, dependencies, CI implementation, database work, push/PR/merge or deployment authorized by this increment.

- [x] Prepared [examples](../../.agents/skills/rest-api-contracts/references/type-safety.md), canonical requirements and skill routing; skill version 0.2.0.
- [x] Local reference links, YAML metadata and whitespace checks passed. All five TypeScript example blocks compiled in memory using existing TypeScript with strict/unchecked-index/decorator options; adding a union outcome produced expected TS2345. No application source emitted, full suite or database run. These are example/type evidence, not runtime API verification.
- Local checkpoint prepared; incidents: none in this increment. Bundled skill validator remains unavailable due to missing PyYAML; YAML parsed with existing Ruby Psych instead.
- Next: review the reference; future CI enforcement stays separate.

## Query-parameter examples — 2026-10-24

User authorized a concise reference on the existing `codex/api-type-safety` branch. Added [query examples](../../.agents/skills/rest-api-contracts/references/query-parameters.md), skill routing and version 0.3.0. Existing canonical rules remain authoritative; no endpoint, dependency, CI or database changes. Local validation passed: parser example accepted four valid cases and rejected eleven malformed/duplicate-like values; example JSON, local links, YAML and whitespace checks passed. These checks do not exercise Fastify, SQL or API behavior. No push/PR/merge inferred. Incidents: none in this increment.

## Skill invocation verification — 2026-10-24

User authorized the concise API verification checklist, mandatory skill routing and a concrete example-based red-flags section (revised after owner feedback), staged for review only. Changed the skill entry point and enforcement reference on `codex/api-type-safety`; no application/CI changes. Local link/whitespace checks passed. These are documentation checks, not runtime verification. User subsequently approved the staged changes and authorized a local commit; push and merge remain outside this increment. Next: the read-only implementation proposal discussed in chat. Incident review: [INC-20261024-01](../quality/agent-incidents.md#inc-20261024-01--api-skill-guidance-required-repeated-user-led-specificity-and-correction).

## Current focus

- Stage: Foundation F-01 remains complete; [acceptance and evidence limits](project-foundation/phase-tracker.md#closeout--2026-10-12).
- Approved topology: one business per LAN installation, dedicated local PostgreSQL, locally served client assets and one maintained codebase; explicit user approval on 2026-10-12. [Decision and rationale](../architecture/vendor-isolation-proposal.md).
- Current activity: Menu/MN-00/MN-01 accepted and integrated through [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9), squash `b09770e`. Orders OR-01 implementation/evidence is integrated through [PR #10](https://github.com/Hijazi313/servicelane-pos/pull/10), squash `2daeb6c`, under the user-requested workflow completion; [Orders phase tracker](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md) owns scope, progress and verification limits. Authorized OR-01 integration run passed all eight cases, including concurrency and two fresh API processes; cleanup verified fifteen empty application tables and migration 0004 remains applied. User explicitly accepted OR-01 on 2026-10-21 under the recorded backend development scope/evidence limits; [closeout](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md#acceptance-and-closeout--2026-10-21). No next phase, deployment or database rerun activated.
- Tooling review: user-authorized [HTTP boundary check](../../apps/api/scripts/README.md#github-actions-verification--2026-10-21) is published and exercised on GitHub; the separately authorized [Authentication repair](business-access/phase-tracker.md#remote-verification--2026-10-21) is pushed at ba72346 and both GitHub workflows pass (seven checker tests; 15 files, zero findings). Integrated through PR #10; exact-head PR checks and the merged main-branch check passed. OR-01 backend development acceptance is recorded in its owning tracker; release acceptance remains separate.
- Current phase: OR-01 complete and user-accepted under its recorded development scope; Kitchen planning is authorized; [KT-00 proposal](kitchen/phase-tracker.md) records resolved business boundaries and completed planning, with no implementation activated. BA-01 complete; BA-02 complete under [user acceptance](business-access/phase-tracker.md#ba-02-acceptance--2026-10-17); BA-D01–06 approved; BA-03-T01 complete and [user-accepted](business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) under its revised development scope; two-database execution deferred, unrun.
- Deferred validation remains in the [canonical foundation handoff](project-foundation/phase-tracker.md#current-handoff--2026-10-12) and [acceptance record](../acceptance/project-foundation.md).

## Current planning handoff — 2026-10-23

BA-01/02/03 accepted development scope and historical execution permissions are owned by the [joint BA tracker](business-access/phase-tracker.md). They do not authorize new Menu or database work.

Current handoff: Menu remains accepted/integrated through PR #9 (`b09770e`). Orders PR #10 is merged (`2daeb6c`) after the authorized PostgreSQL run and exact-head CI passed; local main was updated and remote Orders branch removed by GitHub. Orders source/offline and bounded persistence verification are delivered and explicitly user-accepted under the recorded development limits; [owning phase tracker](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md). Preserve both local Menu/Orders ledgers and pending incident reviews. Kitchen planning-only authorization is now recorded in [KT-00](kitchen/phase-tracker.md), based on verified local/remote main `6125da4` (accepted closeout PR #12). The [proposed scope and acceptance criteria](kitchen/spec.md) have completed [technical review/corrections](kitchen/phase-tracker.md#technical-review--2026-10-23) and are ready for owner approval; [business decisions](kitchen/decisions.md) approve explicit dispatch before payment, preparation-only data and the status/access/immutable-ticket development boundary. No further database run or next-module implementation is activated. Acceptance closeout changes documentation only and follows standing GitHub workflow authorization.

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
| 5 | Kitchen | planning complete; business boundaries approved | [KT-00 / proposed KT-01–02](kitchen/phase-tracker.md); no implementation activated |
| 6 | Billing and payments | proposed | Not activated |
| 7 | Cashier shifts | proposed | Not activated |
| 8 | Inventory | proposed | Stock model unresolved |
| 9 | Reports | proposed | Not activated |

## Integration and release objectives

- First milestone: accept business/branch provisioning and staff authentication/access together, including unauthorized business/branch access rejection and disabled-account behavior. BA-01/BA-02 are accepted; BA-03 is user-accepted under its revised development scope, with actual two-installation execution deferred, unrun, to installation/provisioning validation.
- After minimum Orders, Kitchen and Billing capabilities exist: accept one complete trading flow, including amendments, reconnect and receipt output.
- Before MVP release: reconcile approved menu behavior, payments, shifts, stock and reports; verify recovery and repeatable isolated business provisioning.
- Detailed checklists remain deferred until the relevant modules enter discovery.
