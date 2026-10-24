# Architecture

Read this document when designing or changing backend structure, dependencies or module boundaries. These are project conventions, not claims that one folder structure is an industry mandate.

See the [REST API convention](rest-api-convention.md) for transport contracts, queries, responses, errors and headers. Existing accepted APIs require an authorized migration; CI enforcement is separately scoped.

Shared [HTTP boundary components](../../apps/api/src/infrastructure/http/README.md) are registered for the explicitly approved Menu active listing and Orders capture; additional endpoint migrations require their own contract review.

## Stack and composition

- Node.js, TypeScript, NestJS with the Fastify adapter, PostgreSQL through Drizzle ORM and the `pg` driver. Drizzle Kit generates reviewed SQL migrations; the explicit runner applies them.
- NestJS is the application framework; use `@nestjs/platform-fastify` as its HTTP adapter. Do not build a standalone Fastify application or a parallel Fastify routing/service layer. Define application routes through NestJS controllers and compose features through NestJS modules and providers.
- Monorepo with `apps/api` and a future `apps/web`; frontend choice remains open between React and Next.js.
- Use a modular monolith. The initial deployment targets the restaurant LAN without internet, with authoritative server-side persistence; disconnected-device writes remain unresolved. Multiple vendor rollout is a product requirement. The user approved one business per LAN installation with local API, dedicated local PostgreSQL and locally served client assets on 2026-10-12; see the [topology record](vendor-isolation-proposal.md). Deployment execution remains unauthorized.
- Follow NestJS module/provider conventions and supported Fastify integration. Check adapter compatibility before adopting middleware or plugins; do not assume Express-specific packages work.
- Use Nest dependency injection for composition. Keep domain rules independent of NestJS, Fastify and database libraries.

## Placement and ownership

- `apps/api/src/modules/<business-name>/`: business ownership is visible in directory names: menu, inventory, orders, kitchen, payments, etc. Add modules only when needed.
- Within each module: `domain/` owns business concepts and rules; `application/` owns use cases and required persistence interfaces; `infrastructure/` implements persistence/integrations; `http/` owns controllers, boundary validation and response mapping.
- `<name>.module.ts` declares Nest providers/imports/exports. `public.ts` exposes only intentionally supported cross-module capabilities. TypeScript exports and Nest provider exports must agree.
- Each module owns its tables and writes. No foreign repository imports, direct writes to another module's tables, or casual cross-module joins. Cross-module reporting or atomic workflows require a documented ownership/transaction design before implementation.
- Cross-module calls use the owning module's public interface and Nest exports. No circular dependencies; do not use `forwardRef` as a routine workaround.
- Root `infrastructure/` owns shared technical setup such as configuration, database connections and logging. Module-specific SQL, Drizzle schema declarations and adapters remain in their module. The shared database schema entry point re-exports declarations for migration generation.
- `common/` contains only small, business-neutral code with demonstrated reuse. No business entities, catch-all services, generic repository framework or speculative utilities.
- No global `types/` bucket. Place types beside their behavior; persistence row types stay private to adapters.
- Future `packages/api-contracts/` contains explicit transport contracts only when a consumer needs them. Never share database models or backend services with the frontend.
- `docs/architecture/` records architecture decisions and boundaries; module-local `docs/` records business rules and feature lifecycles; global `docs/modules/` holds cross-cutting guidance; `docs/compliance/` records applicability and evidence; `docs/acceptance/` records user-run scenarios and outcomes.
- Create files and folders only when useful; do not manufacture empty layers or interfaces for every class.

## File naming and responsibility boundaries

Use NestJS component conventions and the existing module pattern for new or changed code. Filenames use lowercase kebab-case with the component suffix; class names use PascalCase matching their purpose. These suffixes follow NestJS documentation examples; the layered placement below is a repository rule, not a universal NestJS folder requirement.

| Component | Filename | Placement and responsibility |
| --- | --- | --- |
| Module | `<name>.module.ts` | Module composition: imports, providers and exports |
| Controller | `<name>.controller.ts` | `http/`: route declarations, transport input and application calls |
| Guard | `<name>.guard.ts` | `http/`: request/route admission and delegation to application authorization |
| Exception filter | `<name>.filter.ts` | `http/`: safe HTTP status, header and response mapping |
| Route decorator | `<name>.decorator.ts` | `http/`: route metadata or request extraction; no business rules |
| Pipe / interceptor / middleware, when needed | `<name>.pipe.ts` / `<name>.interceptor.ts` / `<name>.middleware.ts` | Transport integration in the owning module; use supported NestJS mechanisms |
| Application service | `<name>.service.ts` | `application/`: use cases, authorization and transaction coordination through owned ports/public contracts |
| Domain rules | Descriptive concept/rule filename | `domain/`: framework-independent concepts and invariants |
| Persistence/integration adapter | Descriptive adapter filename; `.service.ts` when a Nest service | `infrastructure/`: storage, hashing and external integration implementations |
| HTTP types/helpers | Focused descriptive filename, e.g. `access-http.helpers.ts` | Beside HTTP consumers; request/reply shapes, headers, cookies and transport conversion |

Keep each Nest component in its own role-named file. Small private helpers and types may stay with their sole consumer; extract only when useful for shared use or clarity. Avoid catch-all files such as `boundary.ts`, `utils.ts` or `types.ts` combining unrelated responsibilities. Do not create empty layers, one file per trivial type, generic frameworks or dependencies to satisfy this table. Existing filenames outside the changed scope do not authorize a repository-wide rename.

HTTP guards may check transport constraints and invoke application authorization. Current role, account/session status, business/branch grants and mutation authorization remain in Authentication application operations; do not duplicate them in controllers, decorators or separate RBAC guards. Application/domain rules must not depend on HTTP request/reply objects, decorators or status mapping. Infrastructure implements application ports; application code must not import concrete persistence adapters. Keep cross-module access behind supported `public.ts` and Nest exports as defined above.

Before adding or moving code, inspect the owning capability index, representative components, exports and callers. Select the role and layer before implementation; reuse the established pattern. For a necessary deviation, explain the concrete constraint and smallest alternative in the change; consequential architecture changes require the existing decision process, not an agent-invented convention.

Before handoff, review affected imports and calls for transport leakage, duplicated authorization, foreign persistence access, circular dependencies and public/provider export mismatches. Update affected links and capability documentation in the same change. Run the smallest relevant existing checks and state their limits: compilation and HTTP tests alone do not prove architecture-wide boundary compliance. The [focused HTTP boundary check](../../apps/api/scripts/README.md) now checks selected transport-import/error-status patterns with the existing TypeScript parser; it is not a complete architecture check. Run `pnpm check:architecture` for all modules; an explicit module selection is only a diagnostic aid. Current findings, local corrections and remote execution limits are recorded in the checker documentation; adding the guard does not authorize unrelated module repairs.

## Persistence and public contracts

- Put Drizzle table declarations in the owning module's `infrastructure/schema.ts`. Re-export them through `src/infrastructure/database/schema.ts` for migration generation; this entry point is not a public interface for other modules.
- Keep queries, inferred database row types and persistence mapping inside the owning module's `infrastructure/`. Add query or repository files when needed; do not require one repository per table.
- Expose operations needed by other modules through `public.ts` and matching Nest provider exports. Define their result types beside the application operation and export them intentionally. Return only the information the consumer needs; never expose Drizzle tables, inferred row types or query builders through this interface. Consumers must not import another module's persistence files.
- Define HTTP request/response contracts in the module's `http/` boundary and map application results into them. Do not derive public API contracts directly from database rows. Explicit application and HTTP types may have the same fields; add separate mapping code only when transformation or field selection is needed.
- Before implementing an operation spanning module-owned data, document ownership and transaction coordination. Do not bypass the owning module's public interface to make the transaction easier.

## Simplicity and change discipline

- Prefer supported framework conventions, established libraries and explicit business rules over custom infrastructure.
- Before adding an abstraction or dependency, identify the current problem, simpler alternative, maintenance cost and evidence. Record consequential trade-offs in a short architecture decision.
- No microservices, event sourcing, generic workflow engines, CQRS framework, event bus, caching layer or plugin system without a concrete requirement and documented justification.
- A custom restaurant rule is legitimate; label it as a business decision rather than an industry standard. No architecture can guarantee that every change touches only one module.
- Controllers translate requests; use cases coordinate behavior; domain code enforces business invariants. Avoid both business-heavy controllers and ceremonial layers that only forward calls.
- Do not expand future phases or implement speculative features while the current increment remains unresolved.

## Capability discovery and documentation upkeep

Each module's `docs/capabilities.md`, linked from its README, indexes implemented public capabilities: capability, linked public entry point, purpose and essential reuse constraints. Use one row per useful capability; state “None implemented” when appropriate. Keep planned behavior in specs/phases.

Before adding or reusing behavior, read relevant indexes, then inspect candidate contracts, implementation and callers for scope, authorization, side effects, transactions and errors. Follow entry-point links and load other documents only as needed; apply the root context-reuse rule. If an index is missing or incomplete, search exports and callers before concluding behavior is absent.

Reuse across modules through supported public interfaces. Share abstractions only when semantics and reasons to change align; check for duplicate rules, circular dependencies and misplaced responsibilities.

Add, change or remove index entries and affected references with the corresponding public capability change, including previously unindexed capabilities. Before handoff, check entries against final code. Internal-only edits need no unrelated documentation updates. Module deletion must remove or migrate its docs and repair incoming links.

Code establishes implementation; specs define intent. Resolve discrepancies explicitly and never list unfinished behavior as available. Source inspection does not prove runtime correctness.

## Multiple restaurant rollout

- Treat Chickano as initial business data, never as application logic. Keep restaurant names, branding, menu, prices, timezone, currency and fiscal configuration outside hardcoded behavior. Demo/seed data must be clearly identified and separate from production configuration.
- Use one maintained codebase with explicit business configuration. Do not introduce customer-specific conditionals or forks. Implement genuinely different business rules only when requirements establish them; avoid a speculative rules engine.
- The [approved topology](vendor-isolation-proposal.md) selects separate LAN installations/databases per business. Implement only after the affected business/access specifications and phase are authorized. Shared tenant routing is outside this rollout; explicit Business/Branch identity and server-enforced scope still apply. Schema-free foundation setup does not implement this topology.
- Each vendor's operational data, access, configuration, reports and backups must be isolated under the selected model. Shared hosting requires explicit tenant-context enforcement; isolated deployments require explicit provisioning and operational separation.
- Changes and migrations must be repeatable across deployments. Do not depend on Chickano-specific identifiers or manual database edits.
- Branch-aware foundations are required now; multiple-branch operation is deferred as described below. Vendor billing, a SaaS control plane, arbitrary customization and microservices are not automatically authorized by restaurant rollout.

## Business, branch and access foundation

- A business is the vendor/data-isolation boundary; a branch is an operational location belonging to that business. Cities are branch address information, not a separate module initially.
- Model business and branch identity explicitly; initially provision one branch per business. Do not encode a permanent one-branch constraint, use a hardcoded branch ID or implicitly select the first branch.
- Orders, kitchen queues, stock and cashier shifts belong to a branch. Server-side operations resolve business/branch context and validate access; client-supplied identifiers alone are not authorization.
- Staff access expresses business membership, permitted branch access and basic roles. The exact schema and role matrix remain to be specified. Reporting and background operations must respect the selected isolation model too.
- Authentication/Access P0 covers staff account lifecycle, secure credential storage, login/logout, session handling, account disabling/access revocation, and defined provisioning/recovery behavior. Define mechanisms and acceptance criteria in the module specification; token/session technology is not selected here.
- Protect operational APIs with server-enforced identity, business/branch access and action permissions. Any public endpoints require explicit justification. The first integrated milestone demonstrates Business/Branch and Authentication/Access together before Menu delivery.
- Follow the approved deployment/isolation topology and obtain specification/phase authorization before persistence and access implementation. Branch-aware data does not provide cross-branch offline synchronization; central versus branch-local hosting and later synchronization remain separate decisions.
- Menu ownership, branch-specific prices/availability, and business-versus-branch fiscal settings remain explicit decisions for their affected specifications. Do not infer override rules from branch support.
- Deferred: multiple-branch management/switching, transfers, consolidated reports and synchronization; public self-service signup, custom permission designers and advanced identity integrations. Controlled provisioning is the initial proposed approach, subject to its specification.

## Decision records

Record consequential new decisions in `docs/architecture/decisions/` when needed. Include context, decision, alternatives, consequences and status. Do not create records for routine implementation choices.

## References

- NestJS controllers and filename examples: https://docs.nestjs.com/controllers
- NestJS guards: https://docs.nestjs.com/guards
- NestJS exception filters: https://docs.nestjs.com/exception-filters
- NestJS custom decorators: https://docs.nestjs.com/custom-decorators
- NestJS modules: https://docs.nestjs.com/modules
- NestJS Fastify adapter: https://docs.nestjs.com/techniques/performance

## Documentation and scoped agent guidance

Global `docs/` owns product-wide records and the global tracker. Each module owns its `docs/README.md` and independent feature specifications/trackers under `docs/features/<feature>/`. Use the repository spec-driven delivery skill; do not duplicate detailed module plans globally.

Optional module-level `AGENTS.md` files add stable scoped constraints to root instructions. Read applicable ancestors before editing; closer instructions take precedence in their subtree subject to higher-priority instructions and explicit user direction. Keep lifecycle state in trackers. Cross-module integration remains required even when features have independent phases.
