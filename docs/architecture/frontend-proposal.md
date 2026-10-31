# Frontend architecture proposal

Status: architecture proposal, updated 2026-11-01. The user selected React, TypeScript and Vite and chose the Ant Design direction with its forms and tables. Validate the visual and interaction fit on a representative cashier screen; this plan does not authorize implementation or establish accepted API contracts.

## Purpose and constraints

Build one maintainable staff-facing web application for multiple restaurant businesses. The approved topology serves its assets on the restaurant LAN alongside the API and a dedicated database. The server remains authoritative for data, prices, permissions and business/branch scope. Business identity, branding, currency and timezone come from validated configuration, not customer-specific code.

The application should work without internet access when its local server and network are available. Device operation while disconnected from that server, including queued writes and conflict resolution, is unresolved; do not imply offline sales support. Deployment, browser security and operational recovery require their own design and evidence.

## Proposed boundaries

- `apps/web` owns the browser application and its build. It consumes HTTP interfaces, never backend services, database models or persistence types.
- An application composition area owns startup, routing, session integration and shared providers. Feature areas own screens, user interactions and API use for a coherent staff workflow. Do not assume a frontend feature must mirror exactly one backend module: a cashier journey may consume several.
- A small shared area holds business-neutral UI and technical code only after a concrete common need exists. Keep feature-specific code with its feature; avoid a general-purpose utilities bucket, speculative layers and circular feature dependencies.
- API boundary code handles transport details and translates documented responses into useful client outcomes. Use the owning backend contract and actual route behavior; accepted routes may differ, so do not assume one error format or retry policy applies everywhere. Shared transport contracts are introduced only when a real consumer justifies them.
- Server data remains server-owned. Keep temporary interaction state local to its feature; use shared client state only when an actual cross-screen need warrants it. Coordinate router loading and the server-data cache so freshness and error handling have clear ownership.
- Access controls in the UI improve navigation and feedback; the API enforces authorization. Follow the existing session, cookie, CSRF and origin contract rather than inventing a browser authentication scheme.

## Proposed library choices

The following are the current recommendations, not installed dependencies or claims of production readiness. Confirm versions and compatibility when a feature first needs each dependency; avoid adding the whole stack to an empty application.

| Need | Recommendation | Reason and boundary |
| --- | --- | --- |
| Routing | [TanStack Router](https://tanstack.com/router/latest/docs/overview) | Typed navigation and URL state help maintain a growing TypeScript application. Use client-side routing with Vite; TanStack Start is not required. Verify route refresh under the eventual local hosting arrangement. |
| Server data | [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) | Coordinates fetching and cached server data. Explicitly choose freshness, invalidation and retry behavior by workflow; [read-query retries](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries) have defaults that may need adjustment. Cached data is not proof that a write succeeded. |
| HTTP | [Axios](https://axios-http.com/docs/intro) | A configured client, timeouts and interceptors can centralize transport behavior. This is a convenience choice, not proof of reliability; keep error handling explicit and respect existing session, CSRF and origin contracts. Never globally retry mutations. |
| UI, forms and tables | [Ant Design](https://ant.design/components/overview/) | Use its themed components, form system and table by default. Configure existing behavior before building custom controls; native controls remain appropriate where simpler. Validate keyboard, touch and visual fit in our own workflows. |
| Validation | [Zod](https://zod.dev/) | Candidate for runtime data validation or a concrete schema need beyond Ant Design's form validation. Validate responses selectively against actual contracts; TypeScript types alone do not validate runtime data. Avoid duplicated business rules and keep server validation authoritative. |
| Verification | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [Playwright](https://playwright.dev/docs/intro) | Candidates for focused logic/component checks and browser journeys respectively. Adopt the minimum required for the active slice; browser tests alone do not verify physical hardware or operational recovery. |

## State ownership

Give each piece of state one clear owner and keep it as close as practical to its consumers:

| State | Proposed owner | Example |
| --- | --- | --- |
| Server data | TanStack Query | Menu, saved orders and shift status |
| Screen or workflow interaction | React state or a feature-owned reducer | An open dialog or an order being assembled |
| Form input and validation feedback | Ant Design Form | Editable fields and their errors |
| Navigation state | TanStack Router URL parameters | Appropriate list filters and pagination that should survive navigation |
| Shared client-only state | React context initially, when necessary | A UI preference used across unrelated screens |

Do not duplicate authoritative server data in a client store. An unsaved order draft may be feature-owned client state; once submitted, follow the actual API contract and treat the server's result as authoritative. Design an explicit response to an uncertain submission before allowing a potentially duplicate order; a client store or cached response does not prove whether a write succeeded.

Start without a separate client-state library. Consider [Zustand](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) when a demonstrated cross-feature or navigation-spanning client-state need is awkward to manage with React; keep any store scoped to its actual owner. Persisting drafts across refreshes is a separate product and data-handling decision, not implied by shared state. Avoid placing sensitive information in URL parameters.

## Component and styling strategy

Use Ant Design as the primary component and theming foundation. Establish an intentional visual direction with its theme tokens and component props, then validate a representative cashier screen for touch, keyboard use, accessibility, clarity and appearance. Customize where the workflow needs it; avoid extensive overrides that make upgrades difficult. The design and interaction details remain open, and library documentation alone does not establish our application's accessibility.

Use Ant Design's form and table capabilities first; do not add React Hook Form or TanStack Table as parallel defaults. Reconsider a separate library only when a documented feature need cannot be met adequately and its maintenance cost is justified. For server-backed tables, define which filters and pagination live in URL state, how they map to the actual API contract, and how Query caches and refreshes the results. Avoid maintaining competing copies of the same state.

Proposed ownership: features own workflow-specific components; promote a component to shared UI only when it has genuinely reusable behavior and a clear owner. Shared components handle presentation and interaction, not API calls or restaurant-specific policy. Use consistent design tokens for typography, spacing, color, focus and interaction states once the chosen approach is understood. Simple native controls are valid; do not recreate complex accessible interactions without a reason. Verify representative flows with keyboard and target devices, not just component-library documentation.

## Illustrative application layout

This is an ownership map, not a scaffold or mandatory set of empty directories. Names and route layout can evolve with the first approved slice.

```text
apps/web/src/
  app/                  # startup, providers, route composition, session wiring
  features/
    <workflow>/         # screens, feature components, API operations and local state
  shared/
    ui/                 # reusable business-neutral components, when justified
    api/                # shared HTTP setup and transport-level handling
    styles/             # shared design tokens and global foundations, when justified
```

Place feature-specific types, validation and focused tests beside the behavior they support. The app composes features; features consume shared facilities and documented backend APIs. A feature should not reach into another feature's private internals: extract a genuine shared capability or compose the workflow at the app level when needed. Routes may use the router's required file conventions, but route files should delegate feature behavior rather than become a second feature implementation. Do not make a global types, hooks or utilities directory for unrelated code.

## Proposed frontend development standards

These standards are proposed for review alongside this architecture. They guide future implementation; they do not create tooling, change agent instructions or approve a frontend implementation phase.

### Code organization and React

- Use descriptive, lowercase kebab-case filenames and PascalCase component names. Group feature screens, components, hooks, types and tests with the workflow they support; create folders when they make discovery clearer, not as empty layers.
- Keep components focused on rendering and interaction. Extract a hook when it owns a coherent reusable behavior or makes a complex component easier to understand; do not extract every event handler. Keep pure calculations separate when they have independent meaning or need focused verification.
- Use the state ownership table above. Derive values during rendering when practical rather than synchronizing duplicate state with effects. Use effects for synchronization with external systems and clean up subscriptions and other resources.
- Keep imports directed from application composition to features and from features to shared facilities. Cross-feature reuse needs an intentional interface or composition; avoid circular imports and importing another feature's private files. Use the router's required route-file convention without making route files a second home for business logic.

### Asynchronous states and errors

- Each data-driven interaction must account for initial loading, empty results, failure and successful data as applicable. Keep existing useful content visible during a background refresh when doing so is safe and make stale or failed refreshes understandable.
- Handle expected API and validation failures in the owning feature according to its actual contract. Use error boundaries for unexpected rendering failures with a clear recovery action and a safe message; they do not replace asynchronous request error handling. Never display raw internal errors or sensitive data.
- Indicate pending actions and prevent accidental duplicate submissions where appropriate. Apply retry and conflict handling according to each operation's contract; do not infer success or failure from a timeout.

### Forms and validation

- Use Ant Design Form for field state, accessible feedback and client-side rules where appropriate. Translate documented server field errors into the form without discarding non-field errors. Keep server validation authoritative.
- Add Zod only for a concrete runtime schema need; define the boundary it validates and avoid maintaining competing copies of the same rule. Never claim TypeScript validates incoming data at runtime.

### Accessibility and visual consistency

- Provide accessible names and associated labels, visible keyboard focus, logical focus order, actionable error messages and semantic controls. Check dialogs and other custom interactions for focus management. Test representative keyboard and touch journeys; a component library alone is not evidence of accessibility.
- Use Ant Design theme tokens and deliberate shared design values for color, typography, spacing and interaction states. Support readable contrast and layouts appropriate to agreed devices; avoid scattered magic values and per-screen theme overrides. The precise visual system and target devices remain open.

### Tooling, dependencies and configuration

- Use TypeScript strict checking and follow the repository's existing Node and pnpm workspace policy. Select linting, formatting and test configuration when the first web slice is planned; integrate with existing checks without implying that current API-only commands already cover the web app. Avoid forced type assertions or `any` to silence errors.
- Test meaningful feature behavior at the smallest suitable level; use browser tests for critical user journeys and avoid tests that only repeat implementation details. Test loading, errors and accessibility interactions where they affect the feature. Record actual checks and limits.
- Add dependencies only for a concrete need, with compatible versions and license review. Check overlap with the chosen stack and plan for supported upgrades. Do not install packages or change the lockfile under this planning proposal.
- Treat all browser-delivered configuration as public. Validate required values at the relevant boundary, never place secrets in the client bundle, and keep environment-specific settings out of business logic. Exact configuration and deployment conventions remain open.

## Reliability and user experience

Show useful loading, empty, denied and failure states where they arise. Distinguish loss of server connectivity from an individual failed request where evidence permits; a browser connectivity indicator alone cannot prove the API is reachable. Never automatically repeat a mutation unless that operation's contract makes retry safe. Reconcile uncertain outcomes before allowing a potentially duplicative action.

Design for accessible keyboard and touch operation, readable information and practical cashier speed. Develop visual style and interaction details with real workflows rather than locking in a speculative design system. Extract reusable components as repeated needs become clear.

## Agent discovery and work

Use the existing root instructions and [spec-driven delivery skill](../../.agents/skills/spec-driven-delivery/SKILL.md) as the entry point. Start with the [global tracker](../planning/TRACKER.md), then this architecture and only the active feature's plan, acceptance criteria and integration guidance. For backend dependencies, inspect the owning module's capability index, actual HTTP contract and current evidence; do not import backend internals or assume a planned endpoint exists. The existing `frontend-integration.md` convention owns consumer-facing permissions, states, errors, retry semantics and links to canonical contracts; use it for each relevant feature before integration, rather than maintaining a second global API catalogue.

Keep durable architecture decisions here or in a focused decision record; keep feature intent and progress in their owning specification and tracker. Add a compact frontend capability index only when implemented reusable capabilities make discovery worthwhile. If the integration spans modules, identify a natural feature or integration owner and link to each backend source. Where agents work concurrently, use the existing collaboration convention for explicit assignments, shared-file ownership and integration evidence; do not create assignments or parallel agents without applicable authorization.

Potential future improvement: a short `apps/web/AGENTS.md` could link to stable frontend boundaries and relevant guidance once the application exists and there is evidence it helps. A frontend-specific skill or additional checks should address demonstrated recurring problems, not duplicate this document. These are proposals only: creating or changing agent instructions, skills, templates or guardrails requires explicit user approval. No frontend application scaffold or new agent guidance is created by this proposal.

## Delivery and evidence

1. Review and agree the boundaries and first milestone; record consequential decisions and unresolved dependencies.
2. Before a frontend feature integrates with the API, prepare its consumer integration guidance: relevant capabilities, available contracts and evidence, permissions, states, errors and retry behavior. Follow links to actual routes and schemas; do not treat an approved specification as proof of availability.
3. Implement small end-to-end slices with a visible staff outcome. Record the backend dependencies, demonstrated behavior, checks and limitations in the owning tracker. Choose the first journey after verifying its actual prerequisites.
4. Verify important user flows and their API interactions with focused checks. Browser/device behavior, local deployment, connectivity recovery, physical receipt output and full trading flow need evidence appropriate to each; source review or isolated tests alone do not establish release readiness.

## Deferred decisions

Detailed visual direction, styling conventions around Ant Design, hosting/origin configuration, supported devices and browsers, disconnected-device behavior, and the first feature scope remain open. The recommended supporting libraries require review in the context of the first slice; no package versions or installation are approved by this document. Integration mapping and frontend agent guidance should follow concrete workflows.
