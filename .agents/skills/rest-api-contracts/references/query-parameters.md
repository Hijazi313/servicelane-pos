# Query parameter examples

Apply the [canonical query rules](../../../../docs/architecture/rest-api-convention.md#query-parameters-and-pagination). This is an illustrative listing contract, not a claim about an existing endpoint. Use the approved endpoint's fields, states and limits.

## One collection, explicit filters

```http
GET /api/v1/records?state=active&createdFrom=2026-10-23T00:00:00Z&createdBefore=2026-10-24T00:00:00Z&sort=-createdAt&limit=50
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

```

```ts
// Good: explicit conversion plus validation; no truthiness or partial parsing.
import { Transform } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

class PageQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^[1-9][0-9]*$/.test(value)
      ? Number(value)
      : value)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
```

Bind through the shared DtoValidationPipe with location `query`. Omission keeps the initializer; malformed text, empty strings and duplicate arrays fail validation. Keep implicit conversion disabled. This is an example for a future approved paginated endpoint, not an implementation of a particular listing contract.

For booleans, explicitly map only documented strings `true`/`false` and validate the result. Validate real calendar dates/range ordering, not just timestamp-shaped regex. Verify the adapter preserves repeated values before DTO transformation; never silently select a first/last duplicate scalar.

## Keep queries scoped and bounded

```sql
-- Illustrative first-page query: values are bound; sort SQL is allowlisted.
SELECT id, created_at
FROM records
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

A cursor is a bookmark holding a deterministic position (such as creation time and ID), distinct from optional time-range filters. Signing prevents undetected alteration; it does not hide contents or authorize access. Do not include secrets or personal data. For new stateless endpoints, use signing material shared and stable across instances and restarts; document configuration and rotation, and assess existing keys before adding another secret. Avoid process-local signing keys unless the operational tradeoff is explicitly approved.

To continue a nonfinal page, retain the filters/sort and supply its nextCursor. Invalid or changed-query cursors return the documented 400 problem. Reauthorize every page; do not promise a frozen dataset. Bounded offset pagination remains an allowed alternative for suitable administrative endpoints.

## Verify the edges

- Reject `limt=50`, `limit=`, `limit=50oops`, `limit=101`, repeated `limit`, and unsupported sort fields.
- Check array OR versus filter AND, impossible dates and reversed/equal bounds.
- Check stable traversal when creation timestamps tie; changed-filter cursors fail and no cross-scope rows appear.
- Check omitted defaults, an empty page and a final null cursor.
- Check tampering, changed scope/limit, independently initialized instances using the same key, and changed-key invalidation; distinguish this from a real restart or deployment test.

These are focused acceptance cases for authorized endpoint work, not permission to add endpoints, tests or dependencies now.
