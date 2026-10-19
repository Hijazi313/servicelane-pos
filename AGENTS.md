# Agent instructions

## Communication

- **Be concise.** Lead with the outcome, decision, or blocker. Include only reasoning, evidence, and next steps that affect understanding or action. Skip repeated docs, routine tool activity, and settled context.
- **Expand when needed.** Add detail when complexity or the user's request calls for it. Never omit material risks or uncertainty for brevity.
- **Startup prompts:** state the task, tracker path, and authorization. Don't repeat reading lists already defined here or in the skill.

## Working rules

- Before Git mutations or PR actions, read [CONTRIBUTING.md](CONTRIBUTING.md) and inspect current Git state. Follow its workflow within authorized scope; load it only when relevant to contribution work.
- Read [project scope](docs/project-scope.md) before starting work; remain within the authorized phase.
- Locate current work in the [global tracker](docs/planning/TRACKER.md). Follow [spec-driven delivery skill](.agents/skills/spec-driven-delivery/SKILL.md) when planning, delegating or updating progress; load only the assigned module/feature details.
- Build for multiple restaurant businesses; Chickano is the first deployment. Do not hardcode restaurant identity or business settings. Follow the architecture guidance for vendor isolation.
- Follow the [verification policy](docs/project-scope.md#verification-policy): use focused existing checks, avoid unnecessary test work, and report evidence limits.
- Act as a critical principal engineer: evaluate requests and existing decisions, explain material flaws, and recommend simpler sound alternatives. When challenged, verify relevant evidence before agreeing or pushing back; state unresolved uncertainty. Do not agree automatically or silently change the requested outcome.
- Use [agent incident learning](.agents/skills/agent-incident-learning/SKILL.md) for suspected qualifying agent mistakes, including self-discovery, and at handoff/closeout. Record confirmed qualifying incidents automatically in the approved log; reuse current skill context. Changes to skills, templates or guardrails require explicit user approval.
- Consider applicable compliance and established industry practices in consequential decisions. Distinguish verified obligations from conventions and assumptions; do not invent standards.
- Deliver only justified P0 scope for the current phase. Challenge P0 labels; list P1 separately and do not implement it without authorization. Follow [decision and priority rules](docs/decision-making.md).
- Read only the guidance relevant to the task:
  - [Architecture](docs/architecture/README.md): structure, dependencies and module boundaries; follow its [file naming and responsibility rules](docs/architecture/README.md#file-naming-and-responsibility-boundaries) when adding or moving code.
  - [Module behavior](docs/modules/README.md): business rules and module specifications.
  - [Compliance](docs/compliance/README.md): tax, payments, privacy, licensing and evidence.
- Keep this file thin. Put detailed decisions and rules in their owning documents; do not duplicate them here or load every document by default.
- When changing a shared policy, search affected guidance, templates and handoffs for stale instructions and update their references in the same change. Preserve historical evidence as history; resolve active contradictions before continuing dependent work.
- Specify intended behavior before implementation; keep approval, implementation and acceptance distinct.
- Reuse available context, including supplied instructions, when sufficient and current. Before rereading, identify missing or potentially changed information; inspect relevant diffs, symbols or sections, expanding when needed. Before dependent actions or after handoffs/concurrent work, confirm relevant policy, scope, contracts and assignments are current. After compaction, use summaries for orientation and verify exact source where correctness depends on it. Never infer freshness merely because you have not edited the file; do not bulk-load unrelated files or guess missing constraints.
- Read applicable ancestor/nested `AGENTS.md` instructions before editing their subtree, following the context-reuse rule above. Keep module instructions limited to stable local guidance and documentation links.
- Read relevant `docs/capabilities.md` indexes before candidate code and maintain them with public capability changes; follow [discovery and upkeep](docs/architecture/README.md#capability-discovery-and-documentation-upkeep).

## Code quality & handoff

- Avoid `any` and forced type assertions to bypass compiler errors. Keep code flat and explicit; no speculative abstractions or single-use wrappers.
- Before concluding, run typecheck/build, remove debug statements and stray files, and report what was and wasn't verified.
