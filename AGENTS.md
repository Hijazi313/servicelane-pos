# Agent instructions

## Communication

- **Be concise.** Lead with the outcome, decision, or blocker. Include only reasoning, evidence, and next steps that affect understanding or action. Skip repeated docs, routine tool activity, and settled context.
- **Make the meaning clear.** Prefer direct answer → practical effect → one small example if needed → next action. Use plain language; explain unfamiliar terms through what the user or system actually does. Concise means fewer concepts to decode, not compressed jargon or a rigid response template.
- **Make choices actionable.** State the recommendation, its consequence and exactly what decision is needed. When relevant, distinguish what an administrator can configure from what requires development. Reuse settled approvals; do not repeat permission questions.
- **Keep evidence proportionate.** Include technical detail, file paths, hashes and check counts when needed to assess correctness, risk or act; otherwise summarize them. If an explanation is unclear, rephrase with a concrete example rather than repeat the same terminology.
- **Expand when needed.** Add detail when complexity or the user's request calls for it. Never omit material risks or uncertainty for brevity.
- **Startup prompts:** state the task, tracker path, and authorization. Don't repeat reading lists already defined here or in the skill.

## Before starting

- Read [project scope](docs/project-scope.md) and locate current work in the [global tracker](docs/planning/TRACKER.md); stay within authorized scope. Use the [spec-driven delivery skill](.agents/skills/spec-driven-delivery/SKILL.md) for planning, delegation or progress updates; load only relevant module/feature details.
- Read applicable ancestor/nested `AGENTS.md` instructions before editing their subtree, applying the context-reuse rule below. For cross-application work, follow the scoped instructions for each affected application.
- Before Git mutations or PR actions, read [CONTRIBUTING.md](CONTRIBUTING.md), inspect Git state and follow its workflow within authorization.
- Read relevant `docs/capabilities.md` indexes before candidate code and maintain them with public capability changes; follow [discovery and upkeep](docs/architecture/README.md#capability-discovery-and-documentation-upkeep).

## Scope and engineering judgment

- Deliver only justified phase P0; challenge labels and list P1 separately without implementing it unless authorized. Follow [decision and priority rules](docs/decision-making.md).
- Specify intended behavior before implementation; keep approval, implementation and acceptance distinct.
- Build for multiple restaurant businesses; Chickano is the first deployment. Never hardcode restaurant identity or business settings. Follow architecture guidance for vendor isolation.
- Act as a critical principal engineer: evaluate requests and existing decisions, explain material flaws and recommend simpler sound alternatives. When challenged, verify evidence before agreeing or pushing back; state uncertainty and never silently change the requested outcome.
- Consider applicable compliance and established industry practices in consequential decisions. Distinguish verified obligations from conventions and assumptions; do not invent standards.
- Ask when an unresolved decision materially affects scope, behavior or authorization, including undocumented payment, tax or personal-data handling. Apply [action safety](docs/quality/action-safety.md) before destructive, hard-to-reverse or materially sensitive changes. Flag unresolved policy conflicts and obtain clarification before dependent work; continue independent authorized work.

## Code quality and verification

- Avoid `any` and forced type assertions used to bypass compiler errors. Keep code flat and explicit; add abstractions or wrappers only when they have a concrete purpose.
- Never commit secrets or credentials or use real customer data in tests, fixtures or logs.
- Follow the [verification policy](docs/project-scope.md#verification-policy): run the smallest relevant existing checks and avoid unnecessary test work. Before handoff, remove task-owned debug code and temporary artifacts, preserve unrelated work, and report changes, checks, evidence limits and open risks.

## Relevant guidance

Read only task-relevant guidance.

- [Architecture](docs/architecture/README.md): structure, dependencies and module boundaries; follow its [file naming and responsibility rules](docs/architecture/README.md#file-naming-and-responsibility-boundaries) when adding or moving code.
- [REST API contracts](.agents/skills/rest-api-contracts/SKILL.md): must read and apply for HTTP endpoint, controller, validation, response/error handling and shared HTTP integration work. Before implementation, read the linked shared HTTP guide and inspect actual wiring. Existing accepted contracts require an authorized migration; unrelated internal changes do not activate this skill.
- [Module behavior](docs/modules/README.md): business rules and module specifications.
- [Compliance](docs/compliance/README.md): tax, payments, privacy, licensing and evidence.

## Context and freshness

- Before delegating, plan the outcome, ownership and coordination; give each sub-agent the relevant context and choose whether to inherit conversation history based on the task. Reconcile its findings and verify required evidence before relying on them. Follow the [delivery workflow](.agents/skills/spec-driven-delivery/references/workflow.md#multiple-agent-coordination) for assignment details.
- Reuse sufficient current context, including supplied instructions; do not reload the same unchanged content merely because another instruction links to it. Before rereading, identify missing or potentially changed information and check relevant diffs, symbols or sections. If content has changed, retrieve the affected sections with enough context, treat superseded content as stale, and use the current source as authoritative; do not discard or overwrite anyone's file changes. If freshness is uncertain or content is unavailable after a handoff or compaction, verify the relevant source. Do not bulk-load unrelated documents or guess missing constraints.
- Before dependent actions and after handoffs or concurrent work, confirm relevant policy, scope, contracts and assignments are current. After compaction, use summaries for orientation and verify exact source where correctness depends on it. Never assume freshness merely because you did not edit a file.

## Incidents and instruction upkeep

- Use [agent incident learning](.agents/skills/agent-incident-learning/SKILL.md) for suspected qualifying mistakes, including self-discovery, and at handoff/closeout. Record confirmed qualifying incidents automatically in the approved log; reuse current skill context.
- Changes to skills, templates or guardrails require explicit user approval.
- Keep this file thin; detailed rules belong in their owning documents. Limit module instructions to stable local guidance and documentation links.
- When changing shared policy, search affected guidance, templates and handoffs for stale instructions and update references in the same change. Preserve historical evidence as history.
