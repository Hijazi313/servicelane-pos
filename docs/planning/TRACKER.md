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

## Shared HTTP pattern assessment — 2026-10-24

User activated step two; preceding agreed next task was a read-only implementation proposal. [Proposal](../architecture/shared-http-pattern-proposal.md) traces the bounded Menu listing and Orders capture on `codex/api-type-safety`, proposes Nest ownership/integration and future offline proof criteria. Source/docs inspected only; no runtime checks, API changes, dependencies, database work or Kitchen branch import. Query pagination cannot be proven by the existing bounded listing. User subsequently authorized proposal refinements: compatibility matrix, shared route-marker error transition, lifecycle sketch, independent parser requirement, always-generated correlation and serialization criteria. Documentation only; no prototype executed. Implementation/migration remain proposed; no commit/push/merge inferred. Next: owner reviews the bounded prototype and contract-migration scope. Incident [INC-20261024-01](../quality/agent-incidents.md#inc-20261024-01--api-skill-guidance-required-repeated-user-led-specificity-and-correction) remains open; this assessment does not close it.

## Shared HTTP offline prototype — 2026-10-24

User explicitly approved the bounded offline prototype in this chat. Test-only [harness, commands and evidence](../../apps/api/tests/http-prototype/README.md) added on `codex/api-type-safety`; production routes/bootstrap/filter and dependencies unchanged. Strict production/prototype compilation plus five focused test groups passed with existing bundled Node v24.22.1. Initial metadata lookup failed; corrected test-only metadata capture guard must precede Access admission. Parser equivalence is sampled and extraction remains unperformed; fixtures serialize in memory, not PostgreSQL. Adapter parsing/unmatched failures remain legacy, marked serialization failure returned safe 500. No database, installation, listener, pagination, CI, migration, commit/push/merge. Review prototype before authorizing extraction/rollout. Incident INC-20261024-01 remains open; ordinary prototype debugging is not a new incident.

## Shared HTTP source components — 2026-10-24

User authorized continuing from the bounded prototype. Implemented reusable [HTTP components](../../apps/api/src/infrastructure/http/README.md), removed the duplicate prototype boundary and switched its harness to the shared source. Existing application routes/bootstrap/contracts remain unchanged. Fresh strict project compilation and all five focused groups passed with Node v24.22.1. No new dependencies, database, pagination or CI changes. User approved a local commit on 2026-10-25; push/merge remain separately authorized. Next: explicitly select endpoint contracts and resolve the production problem-identifier base before migration; do not represent source availability as production adoption. Incident INC-20261024-01 remains open.

## API skill discovery and reuse — 2026-10-24

User authorized the concise mandatory reading/reuse update. AGENTS.md now requires the REST skill for relevant HTTP work; skill version 0.4.0 links the code-owned guide, requires wiring inspection and applicable reuse, and preserves module ownership and migration limits. Detailed wiring remains in the shared README. Local link/YAML/whitespace validation only; no runtime changes or new CI enforcement. User approved a local commit on 2026-10-25; no push/merge. Incident INC-20261024-01 remains open.

## First HTTP endpoint adoption — 2026-10-25

Approved staged shared components/guidance committed locally as `bd207e4`; no push/merge. Prepared the [two-endpoint migration contract](../architecture/shared-http-pattern-proposal.md#first-application-integration--prepared-2026-10-25). Owner approved GET Menu offerings and POST Orders capture migration plus root-relative problem types on 2026-10-25. Source wiring, reusable typed Orders parsing and matched-route Problem Details are implemented; other route bodies/statuses remain legacy. Completion/error diagnostics use safe context. Focused checks and limits recorded below; no deployment implied. Incident INC-20261024-01 remains open.

## First HTTP adoption verification — 2026-10-25

Strict compilation on existing Node v24.22.1 passed. Orders/application + actual Orders HTTP + shared harness + logging: 20 tests passed; actual Menu HTTP: 6 passed; legacy Access/health HTTP: 7 passed. Final architecture source scan: 16 files, zero findings. Affected links and whitespace checks passed. Assertions adapted only for approved contract changes; currency-change retains its established 409 mapping. No database, installation, listener, deployment or CI changes. Source/docs staged for review; commit/push/merge not performed. In-memory serialized fixtures do not prove PostgreSQL concurrency; malformed/oversized/unmatched requests retain the observed legacy fallback. Historical ledgers remain untouched. Incident INC-20261024-01 remains open.

## Nest DTO validation adoption — 2026-10-25

User explicitly authorized Nest ValidationPipe with class-validator/class-transformer. Pinned 0.15.1/0.5.1 using pnpm 12.11.2 with lifecycle scripts disabled; package manifest and generated lockfile updated. Existing pnpm9 node_modules layout prevented an in-place add; isolated temporary installation was linked only for these two new packages. All five isolated package versions/integrities match the generated pnpm lock. Existing dependencies were not replaced. Frozen lockfile-only verification passed. Strict compilation and Orders/application/shared-harness/logging tests: 21 passed; actual Menu HTTP: 6 passed. DTO-specific cases cover nested unknown keys, null rejection, no numeric coercion, safe JSON-pointer field errors, blank normalization and replay. Legacy Access/health HTTP: 7 passed; total 34 focused tests. Architecture scan: 16 files, zero findings. Query DTO example accepted three valid and rejected eleven malformed cases. Final typecheck, local links and whitespace checks passed; no database, deployment, commit/push/merge. Replaced generic and specialized parser pipes with shared DTO validation and concrete controller DTOs on the two migrated endpoints; application/domain normalization is retained. Skill/examples now route to the selected approach. Incident INC-20261024-01 remains open.

## HTTP adoption PR publication — 2026-10-25

User authorized committing the reviewed staged changes and creating a PR from `codex/api-type-safety` to `main`. This publishes the preceding skill guidance, shared HTTP components and approved two-endpoint migration with Nest DTO validation. Existing 34-test, typecheck, boundary and lockfile-only evidence applies; no runtime changes since verification. Final documentation review reconciled stale descriptions of DTO field errors and parsing. Preserve both untracked Menu/Orders ledgers. Next: owner reviews the PR; merge remains unauthorized. Incident [INC-20261024-01](../quality/agent-incidents.md#inc-20261024-01--api-skill-guidance-required-repeated-user-led-specificity-and-correction) remains open; no new qualifying incident in publication work.

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
