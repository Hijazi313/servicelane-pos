# Architecture

Read this document when designing or changing backend structure, dependencies or module boundaries. These are project conventions, not claims that one folder structure is an industry mandate.

## Stack and composition

- Node.js, TypeScript, NestJS with the Fastify adapter, PostgreSQL through Drizzle ORM and the `pg` driver. Drizzle Kit generates reviewed SQL migrations; the explicit runner applies them.
- NestJS is the application framework; use `@nestjs/platform-fastify` as its HTTP adapter. Do not build a standalone Fastify application or a parallel Fastify routing/service layer. Define application routes through NestJS controllers and compose features through NestJS modules and providers.
- Monorepo with `apps/api` and a future `apps/web`; frontend choice remains open between React and Next.js.
- Use a modular monolith. The initial deployment targets the restaurant LAN without internet, with authoritative server-side persistence; disconnected-device writes remain unresolved. Multiple vendor rollout is a product requirement. Shared hosting versus isolated installations and the database isolation model are not yet decided.
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

The module `docs/README.md` indexes implemented public capabilities using the module template's four columns: capability, linked public entry point, purpose and important constraints. Use one row per useful capability, not per function. Keep descriptions brief and constraints limited to those affecting correct reuse. If none exist, say so; planned capabilities belong in scope/phases, not this index.

Before adding behavior, consult relevant indexes and search exports, symbols and callers. Missing documentation does not prove functionality is absent. Before reuse, inspect the candidate's contract and relevant implementation for purpose, access/scope, side effects, transactions and errors as applicable. Read enough code to establish suitability; do not rely on descriptions alone.

Reuse across modules goes through supported public interfaces. Similar-looking code does not justify shared abstractions unless semantics and reasons to change align. Review affected changes for duplicate business rules, circular dependencies and misplaced responsibilities.

Update the index and affected references in the same change when documented capabilities, constraints or links change. Internal-only edits require no unrelated README updates. When deleting a module, remove or migrate its docs and repair incoming references, including tracker links.

Code establishes implemented behavior; specifications define intended behavior. Resolve discrepancies explicitly. Source inspection does not prove runtime correctness.

## Multiple restaurant rollout

- Treat Chickano as initial business data, never as application logic. Keep restaurant names, branding, menu, prices, timezone, currency and fiscal configuration outside hardcoded behavior. Demo/seed data must be clearly identified and separate from production configuration.
- Use one maintained codebase with explicit business configuration. Do not introduce customer-specific conditionals or forks. Implement genuinely different business rules only when requirements establish them; avoid a speculative rules engine.
- Resolve the vendor isolation and deployment model before business persistence, authentication or authorization implementation. Schema-free connection/migration setup belongs to the authorized Project Foundation; it does not select an isolation model. Evaluate isolated installations/databases against shared application hosting using offline operation, data isolation, support, backup/restore and rollout needs. Do not silently assume a shared database or add tenant identifiers without a coherent enforcement design.
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
- Resolve deployment/isolation before persistence and access implementation. Branch-aware data does not provide cross-branch offline synchronization; central versus branch-local hosting and later synchronization remain separate decisions.
- Menu ownership, branch-specific prices/availability, and business-versus-branch fiscal settings remain explicit decisions for their affected specifications. Do not infer override rules from branch support.
- Deferred: multiple-branch management/switching, transfers, consolidated reports and synchronization; public self-service signup, custom permission designers and advanced identity integrations. Controlled provisioning is the initial proposed approach, subject to its specification.

## Decision records

Record consequential new decisions in `docs/architecture/decisions/` when needed. Include context, decision, alternatives, consequences and status. Do not create records for routine implementation choices.

## References

- NestJS modules: https://docs.nestjs.com/modules
- NestJS Fastify adapter: https://docs.nestjs.com/techniques/performance

## Documentation and scoped agent guidance

Global `docs/` owns product-wide records and the global tracker. Each module owns its `docs/README.md` and independent feature specifications/trackers under `docs/features/<feature>/`. Use the repository spec-driven delivery skill; do not duplicate detailed module plans globally.

Optional module-level `AGENTS.md` files add stable scoped constraints to root instructions. Read applicable ancestors before editing; closer instructions take precedence in their subtree subject to higher-priority instructions and explicit user direction. Keep lifecycle state in trackers. Cross-module integration remains required even when features have independent phases.
