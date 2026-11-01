# React and interaction

Status: proposed development conventions, except for separately approved choices linked from [frontend architecture](../../../../docs/architecture/frontend-proposal.md). Apply within authorized scope; resolve material decisions rather than presenting recommendations as accepted policy.

## Ownership and state

- For placement, naming, public interfaces and examples, use [naming and ownership](ownership.md).
- Split components or extract hooks and pure calculations when responsibility, meaningful reuse or complexity warrants it. Keep state near consumers, lift to a common owner when needed, and derive values rather than maintaining duplicate state. Use effects for external synchronization and clean up subscriptions and timers; do not use effects to synchronize derived state. Memoize only for a demonstrated need.
- Route files coordinate navigation; they do not duplicate workflows. Configure aliases consistently in all affected tools only when needed.
- Give drafts a feature owner and lifecycle. Persistence across refresh, shared client stores and sensitive data in storage or URLs require separate decisions; do not assume them. For server state and session changes, use the [API reference](api-state.md).

## Forms and interaction

- Ant Design, including its forms and tables, is the selected direction, subject to representative workflow validation; it is not yet installed. Use its form facilities when appropriate, with client feedback supplementing authoritative server validation. Map documented field errors to fields and retain form-level errors. A separate validation or table library needs a concrete justification.
- Make loading, empty, no-match, denied, error and success states distinguishable where they change the user's next action. Prevent accidental duplicate actions while pending. Handle documented request failures in the feature; an error boundary can isolate unexpected rendering failures but does not resolve rejected requests or safely retry writes.
- Use semantic elements, accessible names, visible focus and logical keyboard interaction. Return focus sensibly after a dialog, direct attention to relevant validation errors, and do not rely on color alone. Verify relevant keyboard, contrast and touch interactions against agreed target conditions; library selection alone does not prove accessibility.
- Use documented component props and theme tokens when theme work is authorized; keep genuine local differences local and avoid broad overrides or wrappers without a need. Validate clarity, touch and keyboard use on a representative cashier workflow before treating the visual direction as proven.

## Verification and dependencies

Use existing strict TypeScript and the smallest suitable checks for the changed behavior. Check relevant loading, failure and accessibility interactions; browser journeys and target-device checks may be needed for critical workflows. Report what ran and what remains unverified; physical hardware and operational recovery need their own evidence. Choose linting, formatting and test tools when needed, not as assumed existing coverage. Add compatible, license-reviewed dependencies only for a concrete authorized need. Browser-delivered configuration is public: never put secrets in it.
