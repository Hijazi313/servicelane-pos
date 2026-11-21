# React and interaction

Status: design judgment and the component and drawer conventions below are approved skill guidance. Other development conventions remain proposed except for separately approved choices linked from [frontend architecture](../../../../docs/architecture/frontend-proposal.md). Apply within authorized scope; resolve material decisions rather than presenting recommendations as accepted policy.

## Design judgment

**For a new screen or a material workflow change**, identify the staff member, common task and expected outcome. Inspect the relevant design reference and existing implementation, then define a task-specific benchmark for hierarchy, interaction and applicable accessibility criteria.

Make the common action and important information easy to find; keep occasional details secondary. Follow the [browser review workflow](../SKILL.md#browser-review-for-ui-readiness) before claiming UI readiness.

**For smaller changes**, use the relevant existing pattern and check the affected behavior. Scale review to the impact; do not require a separate benchmark or browser check for every edit.

For failures and uncertain outcomes, follow the owning endpoint's documented recovery contract and [API and state lifecycle guidance](api-state.md). Do not add automatic retries or show optimistic success unless the contract supports them.

For restaurant workflows, make frequent actions and important values easy to locate and read on desktop and tablet, with practical touch targets that do not force a cramped layout; distinguish applicable order, kitchen and payment states instead of collapsing them into an ambiguous completion state. Keep restaurant identity and settings configurable as supported by the product.

Use the existing design direction and components when they fit. Question whether color, gradients, shadows, decoration and layout serve the task or merely repeat a template; do not introduce a visual identity without a product decision. Consider keyboard, focus, contrast and touch needs under the interaction guidance below. A component library or passing typecheck does not establish a good user experience.

## Ownership and state

- Keep presentation focused on rendering, form interaction and user feedback. Server-side domain and application code remains authoritative for business rules. For a substantial workflow, give feature-owned loading, saving, recovery and request mapping a clear home outside the presentation component when that improves clarity. Reuse existing logic and keep simple local interaction in the component. Do not create hooks, layers or one-file-per-action scaffolding without a concrete responsibility.

- For placement, naming, public interfaces and examples, use [naming and ownership](ownership.md).
- Split components or extract hooks and pure calculations when responsibility, meaningful reuse or complexity warrants it. Keep state near consumers, lift to a common owner when needed, and derive values rather than maintaining duplicate state. Use effects for external synchronization and clean up subscriptions and timers; do not use effects to synchronize derived state. Memoize only for a demonstrated need.
- Route files coordinate navigation; they do not duplicate workflows. Configure aliases consistently in all affected tools only when needed.
- Give drafts a feature owner and lifecycle. Persistence across refresh, shared client stores and sensitive data in storage or URLs require separate decisions; do not assume them. For server state and session changes, use the [API reference](api-state.md).

## Forms and interaction

- Prefer existing Ant Design components, layout primitives and theme tokens. Avoid custom styles, components or wrappers when they meet the need; identify the concrete gap and its user impact when an exception is necessary. Remove task-owned styles, classes and imports made unused by the change, while preserving unrelated work.
- For long create/edit drawers, keep the primary and cancel actions visible in a right-aligned footer, with Cancel before Save. Preserve the form's validation, pending and blocked states, unsaved-draft confirmation and feature-owned recovery behavior. Adapt this pattern when the workflow requires different actions.
- Group related fields in responsive rows when it improves scanning and reduces scrolling. Allocate width to the expected content and task: names and item selectors generally need more room than prices or quantities. Stack fields when space or label length requires it; verify the actual drawer, because Ant Design grid breakpoints follow the viewport. Keep keyboard order, field labels and validation feedback clear.
- Place an action beside the entry or group it affects so its target is clear; keep an add action with the list it extends. Use a compact text action or a recognizable existing library icon when it improves the layout, without making meaning depend on color. Icon-only controls need an accessible name identifying the action and target. Maintain touch target size, keyboard access and visible focus; wrap or stack when space is insufficient. Apply the workflow's confirmation and safety rules rather than assuming every removal is equivalent.

- The product direction for comparable listing-based workflows is a side drawer for creating, editing and viewing an entry, with one shared form for create and edit. Keep the listing route as the context and do not add a separate create URL unless the user approves a need for one. Adapt fields and API operations to the entry and mode. Check drawer usability on desktop and tablet, including focus, scrolling, touch and unsaved changes. If a workflow cannot be used comfortably in a drawer, bring the specific tradeoff to the user before selecting another pattern.

- Ant Design is installed; its forms and tables are the selected direction, subject to representative workflow validation. Use its form facilities when appropriate, with client feedback supplementing authoritative server validation. Map documented field errors to fields and retain form-level errors. A separate validation or table library needs a concrete justification.
- Make loading, empty, no-match, denied, error and success states distinguishable where they change the user's next action. Prevent accidental duplicate actions while pending. Handle documented request failures in the feature; an error boundary can isolate unexpected rendering failures but does not resolve rejected requests or safely retry writes.
- Use semantic elements, accessible names, visible focus and logical keyboard interaction. Return focus sensibly after a dialog, direct attention to relevant validation errors, and do not rely on color alone. Verify relevant keyboard, contrast and touch interactions against agreed target conditions; library selection alone does not prove accessibility.
- Use documented component props and theme tokens when theme work is authorized; keep genuine local differences local and avoid broad overrides or wrappers without a need. Validate clarity, touch and keyboard use on a representative cashier workflow before treating the visual direction as proven.

## Verification and dependencies

Use existing strict TypeScript and the smallest suitable checks for the changed behavior. Check relevant loading, failure and accessibility interactions; browser journeys and target-device checks may be needed for critical workflows. Report what ran and what remains unverified; physical hardware and operational recovery need their own evidence. Choose linting, formatting and test tools when needed, not as assumed existing coverage. Add compatible, license-reviewed dependencies only for a concrete authorized need. Browser-delivered configuration is public: never put secrets in it.
