# Project Foundation — Phase tracker

Parent: [global tracker](../TRACKER.md). Specification: [spec.md](spec.md).
Owner: primary backend planning agent. Status: proposed.
Active phase: planning only; no implementation phase activated.

## Phase authorization

User brief dated 2026-10-11 authorizes repository inspection and planning documentation only. Specification and tooling approval remain pending. No scaffolding, installs or setup commands authorized. Agent-run tests, builds, lints and runtime/device checks remain prohibited.

## Assignment

Solo assignment: foundation spec/tracker and their global tracker/handoff links. Preserve pre-existing staged and untracked documentation. Do not modify Odoo or application code.

## Feature phase tracker

| Phase | Outcome | Status | Exit criteria | Evidence |
| --- | --- | --- | --- | --- |
| F-00 | Reviewable foundation proposal and tooling choices | awaiting acceptance | User agrees tooling and proposed scope | Spec prepared; user decision pending |
| F-01 | Minimal API/database foundation | proposed | [AC-01](spec.md#ac-01--workspace-and-bootstrap) through [AC-05](spec.md#ac-05--repeatable-handoff) | Unavailable; implementation authorization and user-run evidence pending |

## Active planning tasks

| Task | Status | Acceptance target / expected evidence | Dependency |
| --- | --- | --- | --- |
| Inspect repository and discover existing capabilities | complete | Inventory for [AC-01](spec.md#ac-01--workspace-and-bootstrap); source evidence only | None |
| Prepare P0 proposal, contracts and acceptance scenarios | complete | [AC-01–AC-05](spec.md#acceptance-examples); documentation only | None |
| Agree tooling/scope and authorize implementation | awaiting acceptance | [Tooling and open decisions](spec.md#open-decisions-and-risks); explicit user direction | User decision |

## Completion shape

Planning delivers a proposed specification and acceptance-linked implementation boundary. No runnable application or implemented database interface exists. F-01's intended boundary is documented in [completion shape](spec.md#deferrals-and-completion-shape); Business/Branch and Access remain unavailable and gated on isolation decisions.

## Evidence and availability

2026-10-11 source inspection: `rg --files --hidden` excluding Git internals and node_modules found documentation and the local skill only; no package manifest, application source, lockfile or scoped AGENTS.md was found. `git status --short` showed staged documentation/skill files and an untracked architecture handoff; those predate this work. There is no implemented capability index or source candidate to reuse.

| Acceptance | Implementation availability | Evidence | Result / limits |
| --- | --- | --- | --- |
| AC-01–AC-05 | Unavailable | Repository inventory and proposed spec only | All behavioral acceptance pending; nothing executed |

Official-source review supports recommendations, not installed versions or compatibility proven by execution. No tests, builds, lints, installs, setup, runtime or device checks ran.

## Handoff

Changed files: this spec/tracker, global tracker links and architecture handoff links. Existing unrelated work preserved; no files staged or committed by this task.

Next action: user agrees or adjusts the tooling proposal and R-01–R-05, then explicitly authorizes F-01 implementation. Exact compatible package pins must be reviewed before installation. Vendor isolation remains a later business-phase entry gate. Acceptance remains user-run unless verification policy changes explicitly.
