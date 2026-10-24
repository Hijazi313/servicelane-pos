# Query parameter examples

Apply the [canonical query rules](../../../../docs/architecture/rest-api-convention.md#query-parameters-and-pagination). This is an illustrative listing contract, not a new Orders capability. Use the approved endpoint's fields, states and limits.

## One collection, explicit filters

```http
GET /api/v1/orders?state=captured&createdFrom=2026-10-23T00:00:00Z&createdBefore=2026-10-24T00:00:00Z&sort=-createdAt&limit=50
```

| Parameter | Example behavior |
| --- | --- |
| state | Allowlisted array filter; repeated values use OR, duplicates deduplicated |
| createdFrom / createdBefore | Valid timezone-bearing instants; inclusive start, exclusive end; start must precede end |
| sort | Allowlist `createdAt` and `-createdAt`; default descending, with matching `id` tie-breaker |
| limit | Decimal integer 1–100; omission defaults to 50 |
| cursor | Opaque continuation bound to filters, ordering and authorized scope |

Different filters combine with AND. Only support repeated `state` when the approved contract has multiple relevant states; do not invent lifecycle states to demonstrate filtering.

## Parse strings deliberately

```ts
// Bad: malformed values are accepted, and "false" becomes true.
const limit = parseInt('50oops', 10);
const active = Boolean('false');

// Good: example scalar parsing inside the selected validation boundary.
function parseLimit(raw: unknown): number {
  if (raw === undefined) return 50;
  if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw)) {
    throw new Error('INVALID_LIMIT'); // illustrative; use the HTTP validation problem
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value > 100) {
    throw new Error('INVALID_LIMIT');
  }
  return value;
}
```

Use supported DTO/schema/pipe validation; this function illustrates strict parsing, not a new parsing framework. For boolean filters accept exactly documented strings such as `true` and `false`. Validate real calendar dates and range ordering, not just a timestamp-shaped regex.

Reject unknown keys and repeated scalar parameters **before information is lost by normalization**. Verify how the configured Fastify query parser represents duplicates; never silently select the first/last value.

## Keep queries scoped and bounded

```sql
-- Illustrative first-page query: values are bound; sort SQL is allowlisted.
SELECT id, created_at
FROM orders
WHERE business_id = $1 AND branch_id = $2
ORDER BY created_at DESC, id DESC
LIMIT $3;
```

Business/branch values come from authorized server context, never a query-selected tenant. Map validated filters into parameterized predicates and sort choices into fixed expressions; never concatenate user-supplied column names. Later pages use the same ordering and both tie-breaker values for continuation. Do not implement a generic database query language.

```json
{
  "data": [],
  "meta": {
    "requestId": "request-id",
    "page": { "nextCursor": null }
  }
}
```

To continue a nonfinal page, retain the filters/sort and supply its nextCursor. Invalid or changed-query cursors return the documented 400 problem. Reauthorize every page; do not promise a frozen dataset. Bounded offset pagination remains an allowed alternative for suitable administrative endpoints.

## Verify the edges

- Reject `limt=50`, `limit=`, `limit=50oops`, `limit=101`, repeated `limit`, and unsupported sort fields.
- Check array OR versus filter AND, impossible dates and reversed/equal bounds.
- Check stable traversal when creation timestamps tie; changed-filter cursors fail and no cross-scope rows appear.
- Check omitted defaults, an empty page and a final null cursor.

These are focused acceptance cases for authorized endpoint work, not permission to add endpoints, tests or dependencies now.
