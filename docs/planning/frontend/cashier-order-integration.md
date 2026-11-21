# Cashier order capture — frontend integration

Scope and acceptance: [cashier order capture](cashier-order-capture.md). The user approved this consumer journey on 2026-11-21; approved behavior is not evidence that the screen works.

## API usage

The server resolves business/branch from the current staff session and checks permissions on every operation. Use existing session and CSRF handling; do not place secrets or customer information in URLs or logs. Existing [Menu contracts](../../../apps/api/src/modules/menu/docs/features/catalogue/spec.md#source-contracts--mn-01), [Orders capture contract](../../../apps/api/src/modules/orders/docs/features/capture/spec.md#concrete-api-and-storage-design) and [listing contract](../../../apps/api/src/modules/orders/docs/features/capture/order-list.md) are authoritative; endpoint response envelopes differ. Shared [Menu types](../../../packages/api-contracts/menu.d.ts) are available; validate response fields used by the consumer.

| Staff action | API | Meaning and boundary |
| --- | --- | --- |
| Browse active offerings | `GET /api/v1/menu/offerings` | Staff access; only currently saleable definitions and choices. Empty menu is a usable empty state. |
| Price a selection | `QUERY /api/v1/menu/resolve` | Staff session and origin; no CSRF token. One selection, nonbinding preview. The legacy POST remains CSRF-protected. QUERY compatibility across the deployed path remains unverified. |
| Capture | `POST /api/v1/orders` | Staff and CSRF; include expected unit minor amounts, currency/scale and an opaque retry key. Success contains the captured immutable snapshot. Capture policy bounds apply. |
| Find and open | `GET /api/v1/orders` and `GET /api/v1/orders/:id` | Staff access; summaries are paginated newest first, with a separate full detail read. A cursor is opaque and tied to the page limit; an invalid cursor requires restarting at the first page. New captures may appear on a fresh scan. |
| Read limits | `GET /api/v1/orders/capture-policy` | Staff access; effective limits apply to new captures and may differ from defaults. |

## States and recovery

- Keep input and preview state distinct from saved server data. Prevent duplicate submissions while a request is pending. The UI may show a preview total, labelled merchandise; no tax or payable amount is returned.
- Automatically request the price when the selection is valid; a pending or failed request cannot enable adding an item with a stale preview. If the selection changes, older responses must not replace the current price. Offer retry after a failure.
- On a documented price mismatch, show the affected current amounts and require review before a corrected submission. Menu may change again. Invalid or unavailable selections need correction or a refreshed menu. Do not interpret every 409 as a price mismatch.
- For a lost or uncertain capture response, retain the exact submitted request and retry key and offer a retry of that same request. A matching successful replay returns the saved snapshot; a changed request under a successful key conflicts. Do not declare success or failure from a timeout, issue a new key for the uncertain request, or allow an unreviewed duplicate. A refresh can lose this session-only recovery state; do not imply crash recovery.
- Show actionable empty, loading, denied, validation and unavailable states. A failed detail or list read does not undo a successful capture. Clear staff-specific cached data on session changes. Render customer details and instructions as text.
- No automatic mutation retry, offline queue or persisted draft is implied. The list is not a snapshot and returns no count or customer data. No search, amendment or cancellation is available. PostgreSQL pagination and performance for large histories are unverified.

The API needs a stable secret `ORDER_CURSOR_SIGNING_KEY` configured server-side across restarts and instances. It must never be supplied to the browser, committed, logged or included in chat. Rotation invalidates existing cursors; restart listing from the first page.
