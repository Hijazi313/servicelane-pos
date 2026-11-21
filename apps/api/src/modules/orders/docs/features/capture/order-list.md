# Order listing

Status: source implementation in review; acceptance and PostgreSQL verification pending. The user authorized listing before frontend work on 2026-11-21. This extends OR-01 without changing its existing endpoints.

## Outcome and contract

Staff can find saved takeaway orders after a browser refresh and open an order using its ID. `GET /api/v1/orders` reads only the authenticated installation's business and branch, with current staff access checked on every request. It makes no business mutation. Search, amendments and cancellation are outside this increment; absence of correction remains a live-operation limitation.

Optional query parameters: `limit`, a canonical decimal integer from 1 to 100 (default 50), and `cursor`, the opaque continuation from the previous page. Unknown, duplicate, malformed and out-of-range parameters return 400. Results are ordered by captured UTC creation time descending, then ID descending. The page contains at most `limit` summaries with `id`, `createdAt`, `state`, `fulfillment`, `currencyCode`, `scale` and merchandise `totalMinor`; customer details, instructions, lines, retry keys and policy are excluded. Fetch the existing detail endpoint for full information.

Success is 200 with `{data: [...], meta: {requestId, page: {nextCursor}}}`; the final cursor is null. Cursors are signed, bound to business, branch, ordering and limit, grant no access and remain valid across service restarts and instances configured with the same key. An invalid or incompatible cursor returns 400 `/problems/invalid-order-cursor`; start again from the first page. Pages are not a frozen snapshot: newly captured orders can appear on a fresh first-page scan. The timestamp is application-generated, so clock changes can affect ordering.

Shared DTO errors use `/problems/validation-failed`; authentication and unexpected errors use the existing shared boundary. Responses use `Cache-Control: no-store`. No total count is returned. No personal data is used as a query parameter. Existing routes and responses are unchanged.

## Evidence and limits

Offline checks and exact results are recorded in the phase tracker. No database execution or migration is authorized by this change. The creation timestamp is stored inside the existing JSON snapshot; the scoped query has no dedicated ordering index, so performance with large order histories is unverified. Search and a suitable index should be considered against measured needs, not presumed complete.

The API requires `ORDER_CURSOR_SIGNING_KEY`: a unique, secret 32-byte random key encoded as 64 hexadecimal characters. Configure the same value on all instances serving the installation and preserve it across restarts. Missing or malformed configuration prevents API startup. Rotating the key invalidates existing cursors; clients restart listing from the first page. The key does not grant access: authorization and branch scoping are checked independently on every request. No real key belongs in source control or logs.
