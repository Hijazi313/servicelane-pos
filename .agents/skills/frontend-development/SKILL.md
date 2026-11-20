---
name: frontend-development
description: Design, implement or review this repository's frontend application, including UI/UX, screens, components, interaction, styling, accessibility, state and API integration. Use for frontend work in apps/web or cross-application consumer integration; exclude backend-only and generic planning work.
metadata:
  author: "Repository contributors"
  version: "1.5.0"
  project: "ServiceLane POS"
  scope: "Frontend design, implementation and review; feature and deployment authorization remain separate"
  created: "2026-11-01"
  updated: "2026-11-21"
  compatibility: "React, TypeScript, Vite and Ant Design; repository guidance and owning specifications required; guidance only, no runtime enforcement"
  short-description: "Design and review POS frontend workflows"
---

# Frontend development

Follow root and applicable scoped instructions, the current tracker, and [frontend architecture](../../../docs/architecture/frontend-proposal.md). This skill guides execution; it does not authorize features, dependencies, API changes or deployment. Distinguish selected technology from proposed conventions and unimplemented capabilities.

## When to use

Use this skill when designing, changing or reviewing the web application: screens, components, forms, styling, accessibility, client state, frontend tests or browser-side API/session integration. It also applies when a task spans frontend and backend and changes the frontend consumer. Use it for frontend architecture or convention work when those implementation boundaries are in scope.

Do not invoke it solely for backend-only changes, general project planning or unrelated websites. Follow root and applicable application instructions for cross-cutting workflow and other skill selection.

## Route by task

Load every reference relevant to the task; do not load references solely because they exist.

| Task | Guidance to load |
| --- | --- |
| Design, implement or review a screen, component, form, interaction, visual styling or accessibility | Read [React and interaction](references/react-interaction.md), including design judgment |
| Add, move or review frontend files and exports | [Naming and ownership](references/ownership.md); use the illustrative [feature layout template](templates/feature-layout.md) if useful |
| Server data, session or API integration | [API and state lifecycle](references/api-state.md), plus the owning feature's integration guide, capability index, actual HTTP contract and evidence; identify missing guidance or unavailable behavior before depending on it |
| Plan, change or review frontend verification | [Frontend testing workflow](../../../docs/quality/frontend-testing.md), plus the relevant feature's acceptance criteria, test plan and evidence when available |

For UI/UX work, read the [design baseline](../../../docs/design/frontend-design-baseline.md) and inspect relevant linked token and component implementations before adding or extending them. Explain the concrete need for additions. Update affected baseline entries in the same change and verify them against final code. Apply the design judgment in the linked reference before proposing, implementing or reviewing the affected interface; scale the effort to the change. Identify the workflow and ownership, existing components and capabilities, applicable interaction and failure states, and the smallest relevant checks. Specify material behavior before implementation. Keep server authority and scope boundaries intact; do not imply a timeout means a write failed or succeeded. When behavior, contracts or test tooling change, follow the testing workflow's ownership and upkeep rules in the same change. Record actual checks and limits in the appropriate existing handoff. Apply the project verification policy; source review and a component library do not prove browser, device or release readiness.

## Browser review for UI readiness

For a new screen or material interaction change:

1. Before coding, name one realistic staff task and its expected outcome. Use an approved screen as a visual reference when one exists, or follow the applicable Ant Design pattern.
2. Perform the task in a browser at the intended viewport. Inspect what the staff member sees at the decision point. Check that the next action is easy to find and that focus stays visible and follows the task when using the keyboard. Exercise the relevant failure or correction path where one exists.
3. Fix issues found and repeat the affected steps. In the existing handoff, record the viewport, task and observed outcome. If the browser check is blocked, identify the blocker and leave UI readiness pending.
4. Complete the [UI Definition of Done](references/ui-definition-of-done.md) in the existing handoff. Assign the independent audit to a different agent using the [ui-review skill](../ui-review/SKILL.md). Supply the change under review, task, reference pattern, intended viewport, authorized target and checklist evidence.
5. Resolve findings and return the updated change for focused re-review. Mark UI work done only after the independent reviewer passes the current change. If review is unavailable or an applicable item lacks evidence, keep readiness pending.

For example, on staff sign-in, submit an incorrect password using the keyboard, read the error, correct the password and sign in. Check where focus lands after the error and whether the staff member can continue using the keyboard.

## Metadata maintenance

On substantive changes, update `metadata.updated`; adjust `metadata.version` when the skill's documented contract changes. Preserve attribution and creation date.
