# Web application guidance

## Responsibility

Own staff-facing screens, interactions and browser integration. The server remains authoritative for business data, prices, permissions and business/branch scope.

## Stack

The current foundation uses React, TypeScript, Vite and Ant Design. Ant Design forms and tables are the selected direction; representative workflow validation remains open. The [package manifest](package.json) owns dependency versions; the [architecture proposal](../../docs/architecture/frontend-proposal.md) records technology status and unresolved decisions.

## Guidance

For frontend design, implementation or review, use [frontend-development](../../.agents/skills/frontend-development/SKILL.md), which routes to task-specific references. Root instructions and the active feature's specification, integration guide and tracker still apply.

Before adding browser API request handling, inspect the existing [shared HTTP client](src/shared/api/http-client.ts) and reuse it when it supports the endpoint's contract. Keep response validation and endpoint-specific error and recovery behavior with the owning feature. If the client does not fit, explain the concrete limitation before extending or bypassing it.

## Theme and configuration

- When adding or changing visual behavior, first use the existing Ant Design theme and semantic tokens. Update the owning theme or shared design guidance in the same change when a reusable token or convention is needed; keep related foreground, background, focus and interaction states consistent.
- Avoid hardcoding values in screens or components when they represent shared design choices, business identity, branding or settings. Use validated business configuration for business-specific values when a supported source exists; do not invent a configuration API or store secrets in the browser.
- A local literal is acceptable when it is genuinely specific to that implementation or required by the tool or contract. Do not add speculative tokens or abstractions for values that are not shared. Explain a material exception in the change.
