# Module and phase management

Start with the repository `docs/planning/TRACKER.md`, then the assigned phase and relevant specification sections. Trackers coordinate work; they do not authorize implementation or supersede the verification policy. This is a project convention using specification, traceability and evidence practices; no particular file count or layout is claimed as an industry mandate.

## Selective reading

- Locate work through the global tracker; follow its links rather than recursively loading documentation.
- Read the assigned tracker and the specification sections needed for the current task. Read parent module boundaries when ownership or dependencies matter.
- Load architecture decisions, compliance guidance, consumer contracts and source code only where the task touches them. Reuse unchanged documents already available in context; reload when changed or no longer available.
- If a relevant constraint is missing, retrieve its owning document; selective reading must not become guessing. Handoffs link to authoritative details rather than copying them.

## Targeted retrieval

- Start with the assigned task and its acceptance links. Use stable criterion IDs and Markdown section links to locate the relevant spec text; a link alone does not load its content.
- Search for the heading/ID, then read the relevant section with enough surrounding context to understand its meaning. Expand to affected invariants, authorization/isolation rules and dependencies when needed. Do not use arbitrary small excerpts that omit constraints.
- Use repository search and bounded reads instead of loading whole documents by default. Whole-file reading is appropriate when a short file is relevant throughout or a change requires its complete context.
- Prefer references to authoritative content over copied excerpts in trackers or handoffs. The objective is sufficient task context, not a token quota or guaranteed prevention of hallucinations.

## Phase entry and resume

1. Confirm the active phase, assignment, authorization and applicable verification limits. If none is selected, propose the smallest eligible phase; do not infer implementation permission from a roadmap.
2. Apply repository `docs/architecture/README.md#capability-discovery-and-documentation-upkeep` before adding or reusing behavior.
3. Inspect relevant repository state and existing changes before edits (including Git status when the directory is a Git repository). Preserve unrelated work and reconcile a stale handoff with current files.
4. Identify the affected entry points, persistence paths, consumers and existing acceptance evidence. Resolve discrepancies between intended specifications and actual implementation explicitly; neither silently replaces the other.
5. Record a concise active P0 task table or checklist with status and links to acceptance criteria/expected evidence. One focused active task per assignment is preferred; independent assignments may proceed concurrently under agreed ownership.
6. State the completion shape: intended capabilities after this phase, important behavior still absent and the usable interface/boundary for the next phase. Describe intent now and reconcile it with evidence at closeout.
7. Proceed within clear authorization. Ask only about material blocking choices and pause their dependent work; continue independent authorized work.

## Phase transitions and requirement provenance

- Keep a closed phase tracker for its evidence, corrections and explicitly recorded reopening. New work belongs in its owning plan/tracker; leave only a transition link in the closed phase and update global focus. For a small planning task without a separate tracker, the global tracker can own its status and link to the proposal; do not create documents merely to satisfy routing.
- Distinguish confirmed requirements, proposed solutions and open decisions. Before describing behavior as required, identify the supporting user decision or applicable authoritative obligation. Label unsupported inferences as proposals/questions; a confirmed outcome does not automatically confirm a particular technical solution.

## Phase closeout and handoff

1. Review the affected diff/files against approved scope and acceptance criteria. Check that progress is recorded in its owning plan and that requirement claims have supporting decisions or obligations. Preserve unrelated changes; document intentional deferrals and unresolved risks.
2. Reconcile each activated P0 criterion with suitable evidence. Use the smallest relevant checks under the repository verification policy; do not expand verification without justification. Record implemented-but-unverified behavior and pending user acceptance explicitly; rescoping requires a recorded decision, not unchecked work relabeled as done.
3. Apply the architecture capability-upkeep rules to affected indexes and references.
4. Update evidence, status and completion shape in the owning tracker. Update other documents only when their owned behavior, contracts, decisions or assignments changed.
5. Leave one concrete next action and relevant changed-file cautions in the tracker's current handoff. Report the outcome and evidence limits concisely rather than copying the entire tracker into chat.
6. For incident assessment at closeout/handoff, follow [agent incident learning](../../agent-incident-learning/SKILL.md); that skill owns its recording and review requirements.

## Reading by assignment

- Backend implementer: active phase, relevant spec sections and decisions affecting the change.
- Frontend implementer: integration guide, canonical schemas, relevant acceptance criteria and tracker availability/evidence.
- Coordinator: collaboration assignments and relevant trackers; load design details when resolving dependencies.
- Reviewers: changed behavior, affected contracts and evidence. These are starting points, not permission to ignore relevant scoped instructions or constraints.

## Document ownership

- `docs/planning/TRACKER.md`: current focus, module order/status, links and cross-module blockers. Do not duplicate task lists here.
- `apps/api/src/modules/<module>/docs/README.md`: module purpose, boundaries, approved P0/P1 scope, dependencies and module phase tracker. Use [the module template](../templates/module.md).
- For a substantial feature, `apps/api/src/modules/<module>/docs/features/<feature>/spec.md` owns intended behavior and acceptance criteria; `phase-tracker.md` owns progress, evidence and the current handoff. Use the [specification](../templates/feature-spec.md) and [tracker](../templates/phase-tracker.md) templates. A small feature can remain in the module plan; do not create a pack for every fix.
- Architecture decisions and compliance evidence stay in their existing owning documents and are linked from plans.
- `frontend-integration.md` owns consumer-facing API semantics, permissions, UI states, errors, retries and supported journeys. Create before frontend integration; use the [template](../templates/frontend-integration.md). Link canonical payload schemas and acceptance evidence rather than duplicating them.
- `agent-collaboration.md` owns assignments, file ownership and shared-change coordination when multiple agents work on the feature; use the [template](../templates/agent-collaboration.md). Progress and handoffs remain in the tracker.
- `decisions.md` owns material feature-specific choices, alternatives, consequences and unresolved choices when they arise; use the [template](../templates/decisions.md). Product-wide architecture decisions remain global. Move an existing local decision here rather than keeping duplicate copies.
- Keep short risks in the spec or tracker as appropriate; add a separate risk register only when justified. Do not require empty supporting documents.
- Global and module trackers summarize child work; the feature tracker is authoritative for feature state. Specifications do not repeat active phase or completion status.

## Workflow

1. Define the module outcome and ownership before splitting work. Challenge each proposed P0 using `docs/decision-making.md`. Mark scope proposed until agreed.
2. Identify prerequisites and cross-module contracts. Record unresolved decisions rather than inventing answers. One module at a time is the default focus, not permission to ignore integration dependencies.
3. Specify business rules, invariants, affected contracts, relevant failures and observable acceptance examples before implementation. Label specification approval separately from implementation evidence. Resolve blocking decisions; do not invent answers to fill templates.
4. Split the module into small outcome-based phases with entry/exit criteria. Detail only the active phase; retain later phases as objectives.
5. Point the global tracker at the active module and phase. When independent feature work is delegated, record parallel assignments in its collaboration document and link it from the feature tracker.
6. Implement only the approved active P0. If requirements change, update the specification deliberately and assess affected contracts and acceptance criteria before continuing dependent work.
7. Update the owning tracker after meaningful progress, a blocker, scope change or handoff. Update global/module summaries only when their status changes. Do not maintain duplicate percentage estimates or append routine activity logs.
8. Close a phase only when its exit criteria have suitable evidence. Source inspection can establish implementation facts but cannot establish physical output, operational recovery or user acceptance. When code exists without behavioral evidence, report `implemented, unverified`; pending required acceptance means `awaiting acceptance`. An integration phase must establish cross-module behavior before release claims.

## Authorization and routine decisions

- At phase activation, record the approving instruction (link or concise dated reference), approved scope and verification limits in the owning tracker. A direct user request can authorize the work; do not require an extra approval ritual. Parent trackers link to this record rather than duplicating it.
- An active status, proposed spec or agent assignment alone does not grant permission. If authorization is unclear, resolve the affected scope before implementation.
- Make routine implementation choices autonomously within approved scope and established boundaries. Stop dependent work when a material unresolved choice affects business behavior, contracts, isolation, compliance or authorized scope; continue independent authorized work.
- When a collaboration document exists, it alone owns detailed file assignments. The tracker links to it. For solo work, a short assignment in the tracker is sufficient.

## Contracts and evidence

- Specifications may define proposed or approved API contracts before implementation. Approval does not mean the contract is available. Track availability and verification separately in the tracker; the integration guide links to that evidence and distinguishes planned contracts from available behavior.
- Once machine-readable API schemas exist, reference them as the canonical payload definitions; prose explains semantics and failure behavior rather than duplicating schemas.
- Use stable requirement/acceptance IDs within substantial features so phase tasks and evidence can link to criteria without copying them. Do not build a separate traceability system.
- Record evidence type, source, date, result and limits. Distinguish source inspection, user-run behavioral verification and device/operational verification. Do not fabricate evidence or bypass the verification policy.
- For cross-module work, propose a natural owner or a small integration plan. Escalate material responsibility/scope decisions; folder placement alone need not stop progress.

Update the integration guide in the same change when consumer-visible behavior changes. Update the collaboration document when ownership changes and decisions when a choice is confirmed or superseded. Avoid repeated status summaries across these files.

## Status vocabulary

Use `proposed`, `ready`, `active`, `blocked`, `awaiting acceptance`, `complete` or `deferred`. Record a concrete reason and next action for blocked work. Complete requires the stated exit criteria, not merely code written. If reopening a completed phase, record why and the remaining work.

## Multiple-agent coordination

- One coordinating agent owns the global tracker and module-level status; each delegated feature has one named owner. These are work assignments, not new application architecture.
- Before delegation, specify outcome, phase, file ownership, allowed scope, dependencies, acceptance expectations and verification restrictions. The user permits multiple-agent work for this workflow; do not create user-facing chats unless explicitly requested.
- Parallelize independent tasks inside the active module after shared contracts are agreed. Keep dependent work sequential. Cross-module changes require an explicit coordination assignment.
- Before concurrent implementation, record checkout paths, integration branch/base, shared-file owners and integration method in the collaboration document. Do not assume separate chats have isolated files.
- In a shared checkout, use non-overlapping file ownership and one owner for branch/index operations, dependency manifests/lockfiles, migrations and shared contracts. Serialize conflicting edits and commands affecting shared state; do not switch branches or stage another agent's work.
- Use separate worktrees when independent branch work is needed and authorized. They share repository history, not uncommitted changes; pass required specifications/contracts explicitly and avoid shared database or port collisions. Worktrees are an option, not mandatory overhead.
- The integrator reviews assigned diffs, reconciles shared changes and runs justified focused checks under the verification policy. With separate branches, agree the merge/cherry-pick order and integrate on the named branch. With a shared checkout, review the combined diff without an unnecessary merge. Do not discard unrelated changes or treat integration as acceptance.
- If checkout/file ownership is unclear or overlaps, pause conflicting edits and resolve assignments; independent authorized work can continue.
- Each handoff states changed files, decisions, completed/remaining work, blockers and evidence, including checks not run. The coordinator reconciles results and updates the module/global state.
- Do not claim acceptance from another agent's confidence or source review. Distinguish agent checks from required user acceptance under the repository verification policy.

## Scoped instructions

Root `AGENTS.md` applies repository-wide. Read applicable ancestor and nested `AGENTS.md` files before editing their subtree. Closer instructions take precedence within their scope, subject to higher-priority instructions and explicit user direction.

Create module-level `AGENTS.md` only for useful stable local constraints and documentation links. Do not copy root policy, specifications or feature progress into it. This is an agent-tool convention, not a universal industry standard. API module instructions do not automatically scope frontend code; cross-application assignments must identify applicable instructions and contracts.
