# <Operation contract>

Contract status: proposed | approved
Delivery status: unimplemented | implemented, unverified | verified within stated limits
Acceptance: pending | accepted (link decision)
Owner/specification: <link>

Approval does not imply implementation or acceptance. Update each independently.
Use relevant sections only; link authoritative schemas rather than copying them.

## Outcome and scope

Business outcome, representation, included/excluded behavior, existing alternatives.

## Endpoint and access

Method/path; access policy; trusted business/branch scope; CSRF; side effects.

## Request

Path parameters; query names/types/defaults/limits; AND/OR and repeated-key handling;
sorting/tie-breaker; pagination/cursor validity; timezone/date interpretation;
headers/media/Accept policy; body schema; missing/null semantics; structural and
business validation. Identify unresolved decisions explicitly.

## Success and failure

Status, headers, public schema, empty results and safe example.
Pagination metadata and optional typed recommendations, when applicable.

| Failure condition | Status | Problem type | Allowed extensions | Recovery |
| --- | --- | --- | --- | --- |
| <condition> | <status> | <controlled identifier> | <safe fields> | <behavior> |

Validation errors use body/query/path/header locations and JSON Pointer for nested
body fields. Preserve protocol headers. Document fallback and infrastructure limits.

## Retries and concurrency

Duplicate/lost-update risk; existing owning contract link; key transport, scope,
retention and comparison; identical/changed/concurrent replay; retained outcomes;
atomicity; revision/preconditions; timeout recovery. Do not migrate existing retry
or revision behavior without authorization.

## Exposure, diagnostics and compatibility

Selected/excluded response fields; cache policy; correlation; log redaction; audit
needs; affected consumers; breaking changes and rollout; justified exceptions.

## Evidence

Static/type checks; meaningful HTTP/authorization/pagination/retry cases; authorized
persistence checks if needed; observed results and evidence limits; acceptance link.
