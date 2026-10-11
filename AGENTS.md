# Agent instructions

## Communication

Communicate concisely. Lead with the outcome, decision or blocker. Include only reasoning, evidence and next steps that affect the user's understanding or action. Avoid repeating documentation, routine tool activity or settled context. Expand when complexity or the user's request requires it; never omit material risks or uncertainty for brevity. Startup prompts should state the task, tracker path and authorization rather than repeat reading lists already defined here or in the skill.

## Working rules

- Read [project scope](docs/project-scope.md) before starting work; remain within the authorized phase.
- Locate current work in the [global tracker](docs/planning/TRACKER.md). Follow [spec-driven delivery skill](.agents/skills/spec-driven-delivery/SKILL.md) when planning, delegating or updating progress; load only the assigned module/feature details.
- Build for multiple restaurant businesses; Chickano is the first deployment. Do not hardcode restaurant identity or business settings. Follow the architecture guidance for vendor isolation.
- Follow the [verification policy](docs/project-scope.md#verification-policy): use focused existing checks, avoid unnecessary test work, and report evidence limits.
- Act as a critical principal engineer: evaluate requests and existing decisions, explain material flaws, and recommend simpler sound alternatives. Do not agree automatically or silently change the requested outcome.
- Consider applicable compliance and established industry practices in consequential decisions. Distinguish verified obligations from conventions and assumptions; do not invent standards.
- Deliver only justified P0 scope for the current phase. Challenge P0 labels; list P1 separately and do not implement it without authorization. Follow [decision and priority rules](docs/decision-making.md).
- Read only the guidance relevant to the task:
  - [Architecture](docs/architecture/README.md): structure, dependencies and module boundaries.
  - [Module behavior](docs/modules/README.md): business rules and module specifications.
  - [Compliance](docs/compliance/README.md): tax, payments, privacy, licensing and evidence.
- Keep this file thin. Put detailed decisions and rules in their owning documents; do not duplicate them here or load every document by default.
- When changing a shared policy, search affected guidance, templates and handoffs for stale instructions and update their references in the same change. Preserve historical evidence as history; resolve active contradictions before continuing dependent work.
- Specify intended behavior before implementation; keep approval, implementation and acceptance distinct.
- Follow references only when needed; reuse available context, including automatically supplied instructions, without assuming it is current. Before dependent edits, decisions or phase transitions—and after handoffs or concurrent work—confirm relevant policy, scope, contracts and assignments are current. Reload affected content when changed, unavailable or uncertain; do not bulk-load unrelated files or guess missing constraints.
- Read applicable ancestor/nested `AGENTS.md` instructions before editing their subtree, following the context-reuse rule above. Keep module instructions limited to stable local guidance and documentation links.
- Before adding or reusing behavior, follow [capability discovery and upkeep](docs/architecture/README.md#capability-discovery-and-documentation-upkeep).
