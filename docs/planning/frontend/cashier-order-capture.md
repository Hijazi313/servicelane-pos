# Cashier order capture

Status: **active** — source implementation authorized on 2026-11-21. The user approved the scope below and focused local checks; database access, deployment and production actions require separate authorization. The user will provide the practical walkthrough; implementation and acceptance are separate.

## Outcome and phase P0

A signed-in staff member can build and save a takeaway order from the configured active menu, then browse saved orders and open their original details after refresh. This slice is not a complete trading workflow.

| ID | Intended behavior and acceptance outcome | Why this phase needs it |
| --- | --- | --- |
| CA-01 | Browse active offerings; select applicable size, optional add-ons and required/optional combo choices; see the server-resolved price and add a valid selection. | Staff must be able to order the configured menu without inventing prices or choices. |
| CA-02 | Review an unsaved order, change quantities, remove lines, and enter optional customer name/phone and order/line instructions. Show a merchandise total. | Staff can correct the order and preserve the context approved by the user before capture. |
| CA-03 | Save once, display the saved snapshot, and handle validation, unavailable selections, price changes and uncertain outcomes without claiming an unknown write failed or creating an accidental duplicate. | Staff need a trustworthy result and an actionable recovery path. |
| CA-04 | Browse newest-first saved summaries in pages and open an immutable order's details after refresh. | Staff can find captured orders without an ID; the user accepted browsing without search. |
| CA-05 | Keep the draft in the current browser session only; warn before leaving an unsaved order. Clearly handle empty, loading, denied and unavailable states. | Staff can work and avoid accidental loss without adding draft persistence. Refresh or crash can lose a draft. |

Use the existing staff session, Ant Design patterns and theme, shared HTTP client and query conventions where suitable. Desktop and tablet are equal design targets; actual device and browser readiness still require evidence. The server remains authoritative for access, scope, selection and price. The [consumer integration guide](cashier-order-integration.md) owns API behavior and recovery details.

## Deferrals and constraints

Search, saved-order editing and cancellation are unavailable; listing has no customer details or count. Large-history performance and PostgreSQL pagination remain unverified. Persistent drafts, offline sales, payment, tax/payable totals, receipt printing and full kitchen and trading workflows are outside this increment. The absence of correction prevents a live-operation claim. Personal-data retention/erasure and operational recovery remain unresolved for real use.

## Active work and evidence

| Assignment | Owner and boundary | Acceptance / evidence |
| --- | --- | --- |
| Cashier screen and coordination | Primary agent; web UI, integration, shared overview | CA-01–05; focused local checks and requested user walkthrough |
| Orders client | Orders API agent; cashier Orders integration and needed shared transport extension | CA-03–04; contract, errors and retry identity |
| Menu client | Menu API agent; cashier active Menu and resolution integration | CA-01; contract and selection price |
| Planning | Planning agent; this plan, integration guide and tracker summaries | Approved scope and current source/evidence limits |

Shared checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, branch `codex/cashier-order-capture`, based on `main` at `e32c065`; primary agent owns branch/index and integration. No publication authorized. The feature is in progress; acceptance, browser/device review and end-to-end behavior are pending. List source was merged in PR #38; PostgreSQL pagination and history performance have not been verified. Earlier backend capture acceptance does not establish this frontend journey.

## Source handoff — 2026-11-21

The screen, Menu and Orders consumers, staff entry point and recovery handling are implemented in source. An independent source review found preview/repricing races and an unreachable price-recovery action; the corrections received a focused source re-review. Simple single-variant items without extras now start their price preview automatically; rendered tap count is still unverified. The full independent UI review did not pass because no safe mocked browser target or viewport was available. Desktop/tablet rendering, keyboard, focus, touch, correction and browser recovery remain pending, as does the user's walkthrough and acceptance. Do not treat this handoff as release readiness.

Focused mocked API and transport checks: 8 passed. Web typecheck passed on Node 24.18.1, below the repository's supported minimum of 24.21. No build, database, production or integrated browser check was run. The user should test with an appropriately authorized nonproduction target; no database or target access is authorized by this source handoff. In particular, an unknown save's retry identity is only held in the current page; refresh or crash can lose it.

Incidents: none confirmed for this work.

## Cashier UX benchmark and redesign — 2026-11-21

The user requested a better first impression and a practical hot-path benchmark before redesign. This is a source redesign of the already approved capture scope, not authorization for database access, deployment or new backend features. Example task: a cashier adds a configured item with its required choices, adjusts its quantity, reviews the merchandise total and saves, then opens the saved order. The screen should make the next action and current order clear without requiring the cashier to remember selections.

- **Workflow and hierarchy:** show a scannable active catalogue with truthful prices/choice cues beside a compact order summary where viewport space permits; make quantity, total and save easy to find. Keep optional details available without crowding the common path. Use the [illustrative cashier layout](../../design/cashier-layout-review.html) as direction, not as proof of approved behavior or a source for fictitious categories, search or payments.
- **Speed and feedback:** count taps for each defined common action. The existing project target is at most two taps; it is a product target, not a universal POS standard. Required choices may require more; record the count and tradeoff for review. Indicate selection, loading and save outcomes immediately without claiming that an unconfirmed write succeeded or failed. Preserve the existing retry and price-reconfirmation contracts.
- **Accessibility and input:** apply [WCAG 2.2](https://www.w3.org/TR/WCAG22/) criteria, including keyboard operation, visible focus, text error identification and relevant contrast (normal text 4.5:1, large text 3:1, meaningful control boundaries 3:1, subject to the standard's exceptions). WCAG 2.2 AA specifies a 24 × 24 CSS px minimum target with exceptions; the project's stronger 48 × 48 CSS px touch target and 16 px body-text target remain the benchmark. Preserve entered values and give a specific correction path for errors, consistent with [GOV.UK error guidance](https://design-system.service.gov.uk/components/error-message/).
- **Review:** use synthetic mocked responses, not a database. Review the real interaction at representative desktop and tablet viewports, including a configured item, quantity correction, save/recovery and keyboard focus. Measure controls and contrast, count taps, and record what was actually checked. A mock browser does not establish real-device, backend, accessibility-conformance or production readiness. Follow the [UI Definition of Done](../../../.agents/skills/frontend-development/references/ui-definition-of-done.md) and independent review; leave unverified items open.

Representative viewport sizes are review assumptions until target devices are specified. User walkthrough and acceptance remain separate from implementation and automated checks.

## Redesign evidence — 2026-11-21

The updated source uses a price-visible menu grid, compact quantity controls and an order summary alongside the catalogue when space permits; optional details are collapsed. The reviewer requested the instruction inputs match the API's single-line restriction; those inputs were changed accordingly. Price previews and server-side capture remain authoritative.

Builder browser review used an isolated localhost Vite fixture with synthetic responses and no API proxy or database. At requested 1440 × 900 and 1024 × 768 viewport settings, the browser reported 1309 × 818 and 931 × 698 CSS pixels, respectively. The builder inspected both layouts and, at the latter size, selected a simple item and observed its price and merchandise total in the order. Selection and add took two taps after the preview resolved. The fixture and server were removed. The actual screen must still be checked for choice flows, save and recovery, keyboard/focus, touch dimensions, contrast, text resizing and physical devices. The independent reviewer could not access the mock browser, so the UI Definition of Done and independent UI readiness remain pending; source-only review is not a pass. User walkthrough and acceptance remain pending.

Web typecheck passed on Node 24.18.1 (below the supported minimum). No build, integrated API, database, deployment or production verification was performed. The previously recorded API checks do not verify the redesign.

## Automatic price preview — 2026-11-21

The user authorized automatic preview and a read-oriented QUERY route. The selector requests a preview when choices are valid, blocks Add until that selection's request succeeds and offers retry on failure; selection-specific query keys prevent an earlier response from replacing the current selection. The client sends one QUERY without fetching a CSRF token. The existing capture write and legacy preview POST retain CSRF. See the [consumer contract](cashier-order-integration.md) and [Menu contract](../../../apps/api/src/modules/menu/docs/features/catalogue/spec.md#intended-api-boundary).

Focused offline checks: the API compiled and an in-memory actual-controller/Fastify injection test passed for QUERY with no CSRF, bad origin, invalid input, missing grant and revoked session, plus the existing POST's CSRF requirement. Three mocked frontend API checks and web typecheck passed. Checks used Node 24.18.1, below the supported minimum. Browser-to-proxy compatibility, rapid-selection interaction and end-to-end preview remain unverified; no database or production action was performed. Independent UI review and user acceptance remain pending.

## Cashier responsibility separation — 2026-11-21

The user requested separating workflow logic from presentation. The cashier screen delegates order state, pricing recovery, save/retry and history to `use-cashier`; the selection component delegates selection and preview state to `use-offering-selection`; shared cashier money formatting and offering display prices live in `cashier-money`. The server remains authoritative for prices and capture. No screen behavior or API contract was intentionally changed.

Focused simulated-DOM workflow check passed for an uncertain save followed by replay of the exact request and retry identity; web typecheck passed. Both used Node 24.18.1, below the supported minimum. Browser and independent UI readiness remain pending; no database or production action was performed. Incidents: none confirmed in this refactor.

Cashier's active-menu consumer imports offering validation from Menu's explicit [public interface](../../../apps/web/src/features/menu/public.ts). The focused Menu client checks and web typecheck passed on Node 24.18.1; this boundary cleanup did not change API behavior.
