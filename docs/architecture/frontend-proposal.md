# Frontend architecture proposal

Status: proposal, updated 2026-11-01. React, TypeScript and Vite are selected; the user chose the Ant Design direction, including forms and tables. Other boundaries and recommendations below remain proposed unless linked to an approved decision. This document does not authorize implementation, dependency installation or API contract changes. Validate the visual and interaction fit on a representative cashier screen.

## Context and authority

Build one maintainable staff-facing application for multiple restaurant businesses. The [approved topology](vendor-isolation-proposal.md) uses one business per restaurant-LAN installation, a dedicated local PostgreSQL database, locally served client assets and one maintained codebase. Business identity, branding, currency and timezone come from validated configuration, not customer-specific code. Business → Branch ownership is foundational; operating multiple branches remains future scope.

The server is authoritative for data, prices, permissions and business/branch scope. UI access controls are navigation and feedback, not authorization. Follow the actual session, cookie, CSRF and origin contract; do not invent a browser authentication scheme or client-selected scope. Browser-delivered configuration is public and cannot contain secrets.

The application should work without internet while the local server and LAN are available. Device operation disconnected from that server, queued writes and conflict resolution remain unresolved; do not imply offline sales support. Deployment, browser security and operational recovery need separate design and evidence. A timeout does not establish whether a write succeeded: use each operation's actual recovery contract before allowing a potentially duplicate action.

## Proposed application boundaries

- `apps/web` owns the browser application and build. It consumes supported HTTP interfaces, not backend services, controllers, database models or persistence types.
- Application composition owns startup, routing, session integration, shared providers and cross-feature orchestration. Features own coherent staff workflows, including screens, interactions and API use; a frontend workflow need not mirror one backend module.
- Shared code is business-neutral and created for a demonstrated common need. App composes feature public interfaces; features may use shared code; shared code does not import app or features. Avoid circular dependencies and imports of other features' private files.
- Server data stays server-owned. Keep temporary interaction state with its feature, and introduce shared client state only for a demonstrated need. Session or scope changes must not expose another staff member's cached data. Define the exact lifecycle before integration.
- Shared transport handles genuinely common HTTP concerns; feature operations interpret their own endpoint contracts. Existing routes can differ in response, errors, revision and retry rules. Do not globally retry mutations or treat a cached result as proof of success.

The existing app contains `main.tsx`, `app/app.tsx` and `styles.css`. The following is an illustrative destination, not a mandate to create empty folders or a claim they exist:

```text
apps/web/src/
  app/                  # composition, routing, providers and layouts
  features/<workflow>/  # workflow screens, operations and local state
  shared/ui/            # reusable business-neutral interaction, when justified
  shared/api/           # genuinely shared transport, when justified
  shared/styles/        # app-wide theme foundations, when justified
  main.tsx
```

Exact router file conventions, route location, shared-contract packaging and any path aliases remain decisions for concrete use. A future cashier journey may compose several backend capabilities; it must not be assumed that a particular screen, operation or API exists.

## Technology direction

| Need | Status and recommendation |
| --- | --- |
| React, TypeScript, Vite | Selected for the minimal foundation; its [tracker](../planning/TRACKER.md) records acceptance and evidence status. |
| UI, forms and tables | Ant Design is installed with application-owned theme defaults; validate the visual direction on a representative workflow. Native controls can be simpler. Avoid parallel form/table defaults without a demonstrated need. |
| Routing | TanStack Router recommended, not installed or approved by this proposal. Verify refresh under eventual local hosting; TanStack Start is not required. |
| Server data | TanStack Query recommended, not installed. Decide freshness, invalidation, retries and router coordination per workflow. |
| HTTP | Axios recommended as a convenience, not installed; central transport does not establish reliable or safe mutation handling. |
| Runtime validation | Zod is a candidate only for a concrete need beyond form validation; server validation remains authoritative. |
| Verification | Vitest, React Testing Library and Playwright are candidates. Adopt only what an active slice needs; browser tests do not establish physical hardware or recovery behavior. |
| Shared client state | Start without a separate state library; consider Zustand only for a demonstrated need. Draft persistence is a separate product and data-handling decision. |

Confirm compatibility, versions, licensing and authorization at adoption. Current implementation and evidence are owned by the [global tracker](../planning/TRACKER.md) and [web README](../../apps/web/README.md), not this table.

## Delivery and discovery

The [frontend development skill](../../.agents/skills/frontend-development/SKILL.md) routes component and integration work to focused guidance. For substantial features, the [spec-driven delivery skill](../../.agents/skills/spec-driven-delivery/SKILL.md) owns planning, phases, feature integration and handoffs. Feature specifications own intended behavior; trackers own availability and evidence; feature integration guides own consumer-facing contracts and recovery. Discover the owning capability, actual route and evidence before use; an approved contract does not establish availability. Add a frontend capability index when implemented reusable capabilities justify one.

## Open decisions and evidence

Detailed visual direction, Ant Design styling conventions, hosting/origin configuration, supported browsers and devices, disconnected-device behavior, draft persistence, cross-tab synchronization, session/cache lifecycle and the first feature scope remain open. Integration must define applicable loading, empty, denied, validation, conflict and recovery states. Verify representative browser and device workflows, local deployment and recovery separately; physical receipt output and a complete trading flow require their own evidence. Source review or a selected library alone does not establish release readiness.
