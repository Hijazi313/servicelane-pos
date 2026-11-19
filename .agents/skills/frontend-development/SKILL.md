---
name: frontend-development
description: Design, implement or review this repository's frontend application, including UI/UX, screens, components, interaction, styling, accessibility, state and API integration. Use for frontend work in apps/web or cross-application consumer integration; exclude backend-only and generic planning work.
metadata:
  author: "Repository contributors"
  version: "1.0.0"
  project: "ServiceLane POS"
  scope: "Frontend design, implementation and review; feature and deployment authorization remain separate"
  created: "2026-11-01"
  updated: "2026-11-04"
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

For UI/UX work, apply the design judgment in the linked reference before proposing, implementing or reviewing the affected interface; scale the effort to the change. Identify the workflow and ownership, existing components and capabilities, applicable interaction and failure states, and the smallest relevant checks. Specify material behavior before implementation. Keep server authority and scope boundaries intact; do not imply a timeout means a write failed or succeeded. When behavior, contracts or test tooling change, follow the testing workflow's ownership and upkeep rules in the same change. Record actual checks and limits in the appropriate existing handoff. Apply the project verification policy; source review and a component library do not prove browser, device or release readiness.

## Metadata maintenance

On substantive changes, update `metadata.updated`; adjust `metadata.version` when the skill's documented contract changes. Preserve attribution and creation date.
