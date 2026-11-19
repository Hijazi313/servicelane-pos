# Frontend naming and ownership

Status: proposed development conventions, not an approved application architecture or evidence of implemented features. The current web app is a minimal foundation; inspect its current code and the [architecture proposal](../../../../docs/architecture/frontend-proposal.md) before choosing a location. The [feature layout template](../templates/feature-layout.md) is illustrative, not a scaffold or a requirement to create files.

## Choose the owner

| Item | Proposed location and name | Good | Avoid |
| --- | --- | --- | --- |
| Screen | `features/<workflow>/<workflow>-screen.tsx`; coordinates that workflow | `features/cashier/cashier-screen.tsx` exports `CashierScreen` | Putting a workflow screen in `shared/ui` |
| Component | Beside the feature that owns it; use a descriptive kebab-case filename and PascalCase export | `features/cashier/order-summary.tsx` exports `OrderSummary` | `shared/ui/order-summary.tsx` when only cashier uses it |
| Hook | Beside its owning component or workflow; `use-<purpose>.ts`, export `usePurpose` | `features/cashier/use-order-draft.ts` for a coherent draft lifecycle | A global `hooks/` bucket or a hook for every click handler |
| HTTP operation | Beside its owning feature; name the operation, not the transport | `features/cashier/submit-order.ts` for a documented submission | Importing a backend service or putting feature policy in `shared/api` |
| Type | Beside the operation or component that gives it meaning; extract only when useful | Define `SubmitOrderInput` beside `submit-order.ts` | A global `types.ts` collecting unrelated types or sharing database models |
| Focused test | Beside the behavior it verifies, when a test is justified | `order-summary.test.tsx` beside `order-summary.tsx` | Duplicating the same workflow test in every dependent component |

These names are illustrative: they do not imply a cashier feature, operation, endpoint or contract exists. A cross-feature browser journey belongs with the workflow or test area that owns the journey; its exact placement depends on the adopted tooling.

## Boundaries and exports

- App composition may use deliberate feature public entry points. A feature owns its internal files; another feature must not import them. Compose workflows at an appropriate app or workflow boundary instead. For example, importing an explicitly exposed cashier screen is appropriate; importing `features/cashier/order-summary.tsx` from another feature bypasses its owner.
- Shared UI contains business-neutral, genuinely reusable presentation and interaction; it does not fetch data or encode feature policy. Shared transport contains common HTTP mechanics, not endpoint-specific rules. Extract only after a concrete shared need, not to pre-fill directories.
- Prefer descriptive lowercase kebab-case for ordinary files and folders, PascalCase components and `use`-prefixed hooks. Follow tool-required names where they differ. Prefer named exports; an `index.ts` is optional and exposes only deliberate consumer interfaces, not blanket re-exports.
- Keep a small type or helper with its consumer. Do not create files, layers or abstractions for each trivial item. Do not rename unrelated existing files to match an illustrative layout. Document material deviations or unresolved ownership in the existing feature task or decision record; follow applicable scope and approval rules.
