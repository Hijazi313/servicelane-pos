# Initial menu setup

Proposed for user review, 2026-11-20. The phase exit is an administrator creating and inspecting saleable items with sizes, optional add-ons and meal deals, with a disabled photo control labelled “Coming soon”. The basic web foundation is accepted. Menu backend development acceptance and the reported local HTTPS login do not establish browser acceptance for this workflow. [Frontend tracker](TRACKER.md) · [Access handoff](../frontend-access/phase-tracker.md#current-handoff--2026-11-20)

## From empty installation to first offering

1. An authorized operator needs the intended installation, a compatible migrated schema and a trusted same-origin HTTPS client/API. Startup does not apply migrations. On a genuinely uninitialized target, the local provisioning command atomically creates the named business, its first named branch, installation binding, administrator with initial password and explicit branch grant. Supply supported uppercase currency and IANA timezone. Branch address and administrator display name are optional. For an initialized target, establish its state and use existing access or the separate administrator recovery procedure. There is no browser bootstrap step. [Operator guide](../../../apps/api/src/operator/README.md)
2. The first administrator signs in, completes the required password change and obtains a usable session for the bound branch. Check the account through GET /api/v1/auth/me before showing Menu setup, including on direct entry or refresh. The API returns the role, while the existing web account parser retains only display name and password-change state. Read the role in the client for navigation and keep authorization on the server. Use GET /api/v1/context for bound business, branch and currency. Missing context blocks setup. The browser supplies no ownership IDs. [Access controller](../../../apps/api/src/modules/authentication/http/access.controller.ts) · [Web access client](../../../apps/web/src/features/access/access-api.ts)
3. The administrator opens Menu, sees the business/branch and configured currency, creates an ordinary item and inspects the active list. Catalogue ownership is business-wide. Menu must support the configured currency in its precision registry even if bootstrap accepted the code. A successful empty active-list read validates that Menu can load that configuration. Tax, payment settings, shift opening, inventory and a settings editor are not prerequisites for creating this merchandise definition. [Menu service](../../../apps/api/src/modules/menu/application/menu.service.ts)
4. Later, a cashier needs a separately authorized staff account with a current branch grant and usable session. Staff creation is already a protected backend operation. Orders revalidates the selected offering and price at capture. This phase ends with active-catalogue readback, before cashier account management, order submission, kitchen or settlement. [Access capabilities](../../../apps/api/src/modules/authentication/docs/capabilities.md) · [Orders capabilities](../../../apps/api/src/modules/orders/docs/capabilities.md)

## Decisions for the owner

| Decision | Recommendation and consequence |
| --- | --- |
| First catalogue | The owner confirmed sizes, add-ons and meal deals are needed, and requested a disabled item-photo control labelled “Coming soon”. Use the existing per-offering model. Save component items before creating a meal deal. File storage and upload are future work. |
| Inspection and corrections | Recommend showing administrator definitions with availability alongside the active catalogue, so the administrator can find and edit a mistake even when an offering is unavailable. Existing revision checks protect concurrent edits. |
| What unlocks integrated delivery? | The owner reports that browser back after logout cannot regain access. First-login password change, cookie attributes and signed-out direct entry remain open. The owner decides access acceptance or authorizes Menu integration with stated limits. |
| How will usability be accepted? | Agree a representative desktop browser and tablet/browser/orientation with the owner before acceptance. Assess both with the existing theme. Exact devices and minimum viewport remain open. |

## Screen and contract

One protected Menu listing from administrator home. Add and Edit open a side drawer containing a shared create/edit form, with item and meal fields shown as appropriate. Create starts empty; edit loads the full saved definition and revision. The listing remains the underlying context. Begin with name, price and a disabled photo control labelled “Coming soon”. Reveal sizes and optional add-ons only when selected. A meal form selects already saved items and variants, a base price, and any required or optional choice groups. Show prices and choice limits plainly. On desktop use a comfortably wide drawer over the listing. On tablet allow it to occupy the available width, with its content scrollable and actions reachable when the keyboard is open. Validate the complex meal workflow at representative sizes before committing to this layout. Use existing Ant Design components and theme tokens, with visible focus, touch spacing, field labels and textual status. [Design baseline](../../design/frontend-design-baseline.md) · [Theme](../../../apps/web/src/app/theme.ts)

| Operation | Browser behavior |
| --- | --- |
| GET /api/v1/menu/offerings | Send no query keys. Read data and meta.requestId from the envelope and handle matched-route problem responses. Show empty only after a successful empty result. Inspect names, variant prices, optional extras/surcharges and combo base, components and choice limits where present. Use active entries and stable IDs for references. |
| POST /api/v1/menu/offerings | Use the existing session and CSRF proof. Submit a complete item or combo definition using the existing domain contract. Server assigns identity, currency, scale and revision. Match the returned ID on the refreshed active list. No photo is submitted in this phase. |
| Edit and inspect | Administrator GET definitions includes inactive data. PUT replaces the complete definition with expectedRevision and preserved IDs. On a stale revision, retain the unsaved input and offer a fresh read before the administrator reconciles changes. Staff POST resolve provides a nonbinding preview. Preserve existing legacy contracts. |

Trim and validate the name (1–120 Unicode code points, excluding controls and surrogate code points). Accept zero and nonnegative decimal text with up to nine integer digits under the server grammar. Keep the exact string through submission. Context supplies currency but no scale, and an empty list has no offering metadata. Recommend basic syntax checks locally and server validation of fractional precision on first create. Show returned canonical amounts and currency exactly. No fallback currency, browser-derived precision, duplicated registry or new endpoint. Legacy create errors may provide only status, so avoid claiming a particular invalid field or cause without evidence. [Menu controller](../../../apps/api/src/modules/menu/http/menu.controller.ts) · [Catalogue rules](../../../apps/api/src/modules/menu/domain/catalogue.ts) · [Menu capabilities](../../../apps/api/src/modules/menu/docs/capabilities.md)

The owner chose a listing route with a side drawer and no separate create URL. Use one form implementation for create and update, retaining distinct API operations and revision handling. Changing between item and meal is available during creation; existing offering kinds cannot change.

On opening, move focus into the drawer. On close, return focus to its trigger. Prevent accidental loss of unsaved input with a discard confirmation, including backdrop and Escape close. Keep the draft and errors when a save fails, block duplicate submits while pending, and refresh the list after success. During an uncertain write, explain the outcome is unknown and allow the administrator to inspect before retrying. Test scrolling, focus, keyboard operation, touch and text enlargement in the actual UI.

The [visual review mockup](../../design/menu-setup-review.html) illustrates the open drawer and fields. Ant Design documents a form in a drawer, while Carbon recommends testing a dedicated page for longer or more complex forms. Review actual meal setup on desktop and tablet before accepting the pattern. [Ant Design Drawer](https://ant.design/components/drawer/) · [Carbon form guidance](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms)

## Proposed authoring behavior

- An item has one price or named sizes with one price each. Optional add-on groups list named options, their surcharges and the maximum number a customer may select. Extras are optional and apply to all sizes.
- A meal has a base price and saved item variants as fixed components and/or choice groups. A group has a minimum and maximum number of distinct options, with quantities and optional surcharges. A required choice needs a minimum above zero. Component prices do not add to the meal base price. Component add-ons do not carry into a meal.
- Administrators can inspect saved definitions and edit names, prices and choices. Preserve saved identities and send the current revision. Existing variants and options cannot simply be removed where the contract requires preserving them; mark them inactive where supported. Show unavailable offerings and their reason when determinable from returned definitions without guessing.
- Save validates the complete definition. Show clear field errors for local checks and a general correction message for legacy server validation failures. Preserve input after failures. A lost response is an unknown outcome: refresh and inspect before retrying, since duplicate names are allowed. For a stale edit, reload current data and let the administrator reconcile their unsaved changes.
- [Visual review mockup](../../design/menu-setup-review.html) uses fictional examples. It illustrates layout only and does not save data or connect to an API.

## Acceptance and delivery sequence

| Stage | Observable acceptance criterion |
| --- | --- |
| 1. Access and context | With the owner's chosen access boundary, an eligible administrator reaches the screen after mandatory password change. Signed-out, forced-change and ordinary staff users cannot use setup through navigation, direct URL, history or refresh. Unavailable identity, origin rejection or failed context/catalogue load cannot present an authorized empty menu. |
| 2. Read before write | An initialized business with zero offerings shows an empty saleable list and its actual currency. A populated business shows current active offerings, including read-only complex choices, with no inactive options. A read failure offers a read retry. |
| 3. Create and inspect | Create an ordinary item, a sized item with optional add-ons and a meal with saved components and a choice group. Reload and inspect their prices, choices and returned IDs in the active list. Confirm the disabled photo control says “Coming soon” and does not prevent saving. Edit an existing item and meal, reload and verify the changes. Check zero, excess precision and a non-two-decimal currency. Invalid input preserves editable values and creates no row. |
| 4. Handle interruption | On 401 recheck access and on 403 deny the action without guessing its cause. Show actionable correction or refresh for rejection. A lost create response has an unknown outcome. Retain the input, explain that a duplicate is possible, reload the list and require an explicit decision before another submit. Names can repeat. If create succeeded but readback failed, retry only the read and retain the returned ID. |
| 5. Review | Demonstrate create, inspection and recovery using keyboard on desktop and touch on tablet, including long labels, focus order, inline errors and readable prices without horizontal form scrolling. Record device/browser, observed results and limits. Seek explicit user acceptance before cashier UI delivery. |

After scope and source authorization, deliver access and read-only inspection first, ordinary and sized items with add-ons and editing second, and meal creation and editing third. Verify each increment before integrating it. Use focused existing frontend checks for role, contract shapes, exact amounts and unknown outcomes. Representative browser checks and any database-backed exercise require their own authorized environment. Current evidence is local documentation and source inspection only.

**P1 for this screen.** Image upload and file storage, deactivation, categories, imports and branding configuration are deferred. Image storage, retrieval, validation and recovery need a separate design when that work is authorized. The later cashier workflow remains separately scoped.

**Handoff.** Owner to review the proposed workflow and access gate before implementation. Planning/documentation only. Incidents: none in this task.

## Implementation in progress — 2026-11-20

The user authorized the menu implementation. Access acceptance remains separate. The initial implementation uses the existing listing, definition and save contracts and a shared drawer form. Image upload remains disabled.

| Work | Status |
| --- | --- |
| Administrator route, context and catalogue read | Implemented, source and mocked client checks |
| Item, size, add-on and meal create/edit | Implemented, browser coverage incomplete |
| Desktop and tablet browser review, including error and correction paths | Pending. Synthetic desktop browser opened the drawer and saved one ordinary item. |
| Independent UI review and user acceptance | Pending |

Do not infer browser, database or release acceptance from source changes. Incidents: none in this implementation handoff.

Verification: web typecheck and build passed on Node 24.18.1, below the repository supported minimum 24.21.0; build reports a large chunk warning. Seven synthetic API/access checks passed. A local in-memory mock browser demonstrated one ordinary item save. No database was accessed. Independent source review found conflict-recovery problems; the preview now shows saved nested choices, but rendered recovery and independent desktop/tablet review remain pending because the reviewer had no browser surface. User acceptance remains pending.

## Shared Menu contract — 2026-11-21

The backend and frontend use the shared [Menu declaration](../../../packages/api-contracts/menu.d.ts) for saved offerings. The frontend uses its separate create/edit definition type, where new nested IDs can be omitted, and checks response shapes at runtime. The declaration is imported as types through relative paths, without changing workspace installation or runtime dependencies. Existing Menu HTTP behavior remains unchanged. Offline Menu tests, frontend API checks and both application typechecks passed on the available Node 24.18.1, below the supported minimum. The web build passed with its existing large-chunk warning. The earlier browser and independent review limits remain open.

## Frontend responsibility cleanup — 2026-11-21

Menu loading, saving and recovery state now live in the feature's workflow hook. The form delegates request mapping to the draft module, while the server remains authoritative for catalogue rules. A create-time 409 no longer enters the edit-conflict recovery path. Web typecheck, existing Menu client checks and a focused draft-mapping check passed on Node 24.18.1, below the supported minimum. Browser and independent review remain pending. Incidents: none confirmed in this cleanup.

## Contracts workspace package — 2026-11-21

The shared Menu declaration is now exported by the type-only `@servicelane/api-contracts/menu` workspace package. Both applications declare a local workspace development dependency and use named type imports. This supersedes the earlier relative-import arrangement. The frozen lockfile records the local links. API typecheck, web build and existing Menu client checks passed using Node 24.21.0; the web build retains its large-chunk warning. Runtime API behavior is unchanged. Prior browser and access acceptance limits remain open. Incidents: [INC-20261121-01](../../quality/agent-incidents.md#inc-20261121-01--offline-workspace-install-interrupted-local-dependencies).

## Current handoff — 2026-11-21

The user requested local checkpoints and a fresh-chat handoff. The topic branch contains source for administrator Menu listing and create/edit drawer, shared contracts, and the access routing refactor. This is an implementation checkpoint, not feature acceptance or release readiness. Desktop/tablet Menu workflows, including complex definitions and recovery, and the independent UI review are pending. Access remains active and separately unaccepted.

The next owner should first inspect the current checkout and reconcile the pending save/recovery findings against source: the create response ID is discarded even though duplicate names are permitted, and legacy 409 responses cover several causes rather than uniquely identifying stale edits. Preserve unknown-write outcomes and existing contracts. Then complete focused authorized corrections and representative synthetic browser/independent review. Database-backed verification, deployment, push, PR and merge require their own authorization. Use the existing supported Node 24.21.0 and pnpm 12.11.2. Image upload remains deferred.

Incidents: [INC-20261121-01](../../quality/agent-incidents.md#inc-20261121-01--offline-workspace-install-interrupted-local-dependencies), corrected with user review pending. Earlier evidence in this document is historical; the contracts package supersedes the initial relative-import arrangement. Check Git for exact current commit and publication state.

## Save recovery continuation — 2026-11-21

The saved response ID is retained for active-list readback, including when the first reload fails; reload retries reads only. An absent ID in a successful active list is reported as unavailable, not as a failed write. A malformed or lost save response remains an unknown outcome. Legacy 409 is reported without attributing a cause: it can represent stale revision, unavailable selection, changed currency or capacity. Edit recovery retains the draft and offers the refreshed definition and revision; a reload does not establish which cause occurred. The API contract is unchanged.

Verification on Node 24.21.0: web typecheck passed; five focused Menu API checks passed, including returned create identity and no automatic retry on rejection. The first test invocation used strip-only mode, which cannot parse the existing TypeScript parameter property; rerunning with the existing transform-types option passed. These checks do not exercise rendered readback failure or prove real persistence. No database was accessed.

Independent synthetic browser review and its limitations are recorded below. Access acceptance remains separate; image upload remains deferred. Incidents: none confirmed in this continuation; [INC-20261121-01](../../quality/agent-incidents.md#inc-20261121-01--offline-workspace-install-interrupted-local-dependencies) remains pending user review.

### Independent UI review — synthetic, partial

An independent reviewer used Chrome with a local Vite and in-memory synthetic API target, without a database. Desktop viewport was not measured reliably; responsive emulation was set to 768 × 1024. On desktop the reviewer opened Add item, observed focus on Name, saved a flatbread at USD 7.50 and saw its matching active ID. An empty submission showed required-field errors but initially left focus on Save. The form was corrected to focus the first invalid field; focused re-review observed focus on Name. In 768 × 1024 emulation, the reviewer corrected empty fields, saved an ordinary item at USD 2.00 and observed the matching active ID. The photo control was disabled and labelled coming soon. Emulation used mouse/accessibility interaction, not physical touch.

UI Definition of Done for the current change (independent verdict **pending**):

- [ ] Staff task: ordinary item save observed; sized items, add-ons, meal creation/editing and recovery remain untested.
- [ ] Visual hierarchy and consistency: rendered empty list and drawer observed; full visual decision-point review remains open.
- [ ] Layout and input: ordinary save at emulated 768 × 1024 observed; long labels, scrolling, text enlargement and physical tablet remain open.
- [ ] Touch targets: dimensions not measured, including switches and checkboxes.
- [x] Cashier hot path: N/A; this is administrator catalogue maintenance.
- [ ] Body text: computed sizes not measured.
- [ ] Contrast: text, controls and state ratios not measured.
- [ ] Keyboard and focus: initial drawer and invalid-submission focus observed; complete keyboard journey and dismissal focus remain open.
- [ ] Feedback and recovery: required-field errors and correction observed; write/readback and 409 recovery remain untested in browser.

Independent review has not passed the current change. Complete the open checks on the synthetic target and re-review before marking UI readiness done; real devices, integrated persistence and user acceptance remain separate.

### Discard confirmation — 2026-11-21

Replaced the browser-native unsaved-draft confirmation with an Ant Design modal. Keep editing retains the draft; Discard changes closes the drawer. Web typecheck and diff check passed. Browser interaction was not exercised because an existing Menu drawer was open in the user's session; the broader UI review remains pending. Incidents: none confirmed.

## Acceptance and closeout — 2026-11-21

The user requested closeout under the revised scope after reporting that all six guided local walkthroughs passed: ordinary and sized items, add-ons, meal creation, editing/reload, validation and discard confirmation. This is user-reported functional evidence for the initial administrator Menu workflow, not independent release or device acceptance. The owner explicitly deferred broader recovery, full keyboard, touch-target, text-size and physical-device testing and the remaining independent UI review. The partial synthetic review above remains historical evidence; its checklist is not marked passed. Image upload remains deferred; the disabled control remains in place. Access acceptance is separate.

The user also reported slow save and readback; the cross-application [known issue](../../../KNOWN-ISSUES.md#ki-01--slow-authenticated-workflows-on-the-development-database) owns the measurements, hypotheses and proposed investigation. No performance solution is accepted or implemented by this closeout. Menu source is on the local topic branch; integration, publication, deployment and release acceptance are not implied. Future Menu work belongs in its own scoped follow-up rather than reopening this closed increment automatically. No new runtime or database checks were run for this documentation closeout.

Incidents: none confirmed in this closeout. [INC-20261121-01](../../quality/agent-incidents.md#inc-20261121-01--offline-workspace-install-interrupted-local-dependencies) remains corrected with user review pending.

## Integration — 2026-11-21

The user authorized integration. [PR #29](https://github.com/Hijazi313/servicelane-pos/pull/29) squash-merged at `c8f8fc0` after the exact `7bb7c27` head passed PR title, documentation links and HTTP boundaries checks. Local web typecheck, focused Menu/session and Server-Timing checks also passed. The earlier closeout's topic-branch statement is historical. Performance, deferred verification, image upload and separate access acceptance remain unchanged; no deployment or database migration is implied. Incidents: [INC-20261121-02](../../quality/agent-incidents.md#inc-20261121-02--github-connection-incorrectly-reported-unavailable) awaits user review.
