# REST API convention

## Status and adoption

User-authorized documentation/skill increment, 2026-10-24. Applies prospectively to new or materially changed contracts after integration; existing accepted APIs remain unchanged until a scoped migration is authorized. Skill behavioral validation is separate from runtime API verification. CI enforcement is deferred.

This convention covers ordinary JSON business endpoints. HTTP/RFC requirements, project defaults and operation-specific decisions are distinct. Endpoint-specific limits and justified exceptions belong in the owning approved contract. Defaults do not authorize new product capabilities.

## Routes and methods

- Business routes use `/api/v1`; resources use plural lowercase kebab-case names.
- Keep useful collection and detail endpoints. Consolidate equivalent searches through filters, not separate endpoints per status/date. Different representations or access policies may justify separate routes.
- GET performs no business mutations. POST creates resources or executes explicit business actions. PUT replaces the target representation; PATCH performs documented partial changes. Define omission/null semantics. DELETE never implicitly authorizes physical removal of trading history.
- Do not optimize for endpoint count or introduce generic query languages.

## Request contracts

Declare path/query/header/body contracts and limits. JSON fields and query names use camelCase. Reject unknown body/query fields, malformed values and duplicate scalar query parameters. Repeated parameters are allowed only for declared arrays. Defaults apply to omission, not invalid input.

Validate structure at the HTTP boundary; retain business invariants in application/domain code for all callers. TypeScript types do not validate JSON. Avoid silent conversion: query `false` is not a truthy string boolean. Define missing, null, empty text and empty array behavior.

JSON bodies use documented JSON media types. Malformed JSON returns 400, unsupported media types 415 and excessive content 413. Document body support per operation rather than building custom body detection for every body-less route.

## Type safety

- Keep TypeScript strict mode and unchecked-index protection. Do not bypass errors with explicit/implicit any, double assertions, unjustified non-null assertions or suppression comments. Narrow unknown input and caught errors before use.
- Define validated request DTOs or schemas for body/query/path and relevant headers. Use supported Nest pipes/integrations; DTO classes and TypeScript annotations alone do not validate runtime data. Application operations receive validated typed input; domain invariants remain enforced for every caller.
- Define explicit public response and application result contracts. Structural typing does not strip extra fields; select exposed fields deliberately.
- Use discriminated unions and exhaustive handling for finite business outcomes, error mappings and client recommendations. Avoid broad string/unknown payloads where the supported variants are known.
- Await asynchronous operations or provide an explicitly owned completion/failure path. Do not silently swallow failures or convert failed mutations into success. Catch only for deliberate recovery/translation/context; preserve unexpected errors for safe boundary handling and correlated diagnostics.
- Typechecking and focused runtime checks complement each other. Neither guarantees the absence of unexpected failures. HTTP filters do not cover detached work or process-level failures.

See [practical examples](../../.agents/skills/rest-api-contracts/references/type-safety.md). No validation dependency or existing API migration is selected by this requirement.

## Query parameters and pagination

| Concern | Convention |
| --- | --- |
| Filters | Explicit endpoint-specific names and allowlisted values |
| Combination | Different filters AND; repeated values of a declared array OR; deduplicate valid values |
| Sorting | `sort=createdAt` ascending, `sort=-createdAt` descending; comma-separated only when multiple fields are supported |
| Continuation | `limit`, `cursor` for growing operational feeds |
| Search | `q` only where matching semantics are specified |
| Time ranges | `<field>From` inclusive; `<field>Before` exclusive |

Timestamp filters require offsets/timezones. Business dates use YYYY-MM-DD interpreted in configured business timezone. Limit filter arrays, search length, time spans and sort-field count. Use parameterized values and allowlisted sort/filter mappings. Filters narrow authorized scope; they never establish identity or grant access. Do not place credentials or tokens in URLs; sensitive search workflows need explicit transport/logging design.

Default page size is 50, maximum 100 unless the owning contract justifies smaller limits. Reject invalid/out-of-range limits with 400. Always specify deterministic ordering with a unique tie-breaker. Do not return totalCount unless needed.

Prefer cursor pagination for changing operational collections; bounded offset pagination is acceptable for a justified administrative workflow with explicit limits. Small bounded configuration collections may return complete lists with documented scope/response caps.

Cursors are opaque, validated and bound to query/order/scope. Base64 alone is not tamper protection. Reauthorize each page; a cursor grants no access. Specify expiry if any and a 400 problem for invalid/incompatible cursors. Do not promise snapshot consistency across pages unless implemented.

## Success representations

Ordinary business JSON uses `{ "data": ..., "meta": { "requestId": "..." } }`. Objects represent detail/mutation results; collections use arrays, including `[]` when empty. Cursor pages include `meta.page.nextCursor`, with null at the end. Avoid redundant success booleans and body-level HTTP statuses. 204 has no body. Health, files and streams have explicit exceptions.

Public response contracts select fields deliberately, never automatically expose persistence rows. Reuse application results only when their public shape is intentional. Define null versus omitted fields. IDs are opaque strings; instants use UTC ISO 8601; business dates use YYYY-MM-DD. Money uses exact minor-unit strings with currencyCode and scale. Never convert exact amounts through floating point.

## Status codes and errors

Use real HTTP statuses: 200 success with content; 201 creation with Location; 204 no content; 400 invalid request; 401 missing/invalid authentication; 403 denied access; 404 absent/unavailable within scope; 405 unsupported method with Allow; 406 unacceptable representation when strict negotiation is selected; 409 state/retry/body-revision conflict; 412 failed HTTP precondition when supported; 413 excessive content; 415 unsupported media; 429 throttling; 500 unexpected failure; 503 known temporary unavailability.

Preserve applicable authentication challenges and other protocol headers. Use 400 for validation rather than adding 422 without a concrete decision. Never disguise failure as 200 or classify every exception as 503.

Application-generated failures use RFC 9457 `application/problem+json`, with the problem at the top level:

```json
{
  "type": "https://api.example.com/problems/invalid-query",
  "title": "Invalid query parameters",
  "status": 400,
  "detail": "One or more query parameters are invalid.",
  "errors": [{ "location": "query", "field": "limit", "code": "OUT_OF_RANGE" }],
  "meta": { "requestId": "request-id" }
}
```

The domain above is illustrative, not a deployed endpoint or approved production domain. Choose a stable controlled HTTPS base before publishing new problem identifiers. Do not invent unregistered URN namespaces. Clients do not need to fetch problem URLs during offline operation.

Maintain one typed problem-definition list in the shared HTTP boundary when runtime adoption is authorized: type, title, status and allowed extensions. Module HTTP mappings reference it. Until then, approved owning contracts list their proposed identifiers; do not create a speculative runtime registry.

`type` is the stable category; title is its human summary (localization may vary); status matches HTTP; detail is safe occurrence-specific guidance. Optional instance identifies the occurrence. Clients branch on type and documented extension codes, never human text. `errors`/`meta` are project extensions. Validation locations are body/query/path/header; nested body paths use JSON Pointer. Never echo secrets or include SQL, stacks or raw internal exceptions.

Module HTTP code maps semantic errors; shared transport code provides safe formatting, protocol-header preservation and fallback diagnostics. Domain errors have no HTTP statuses. Connection/proxy failures outside application control cannot be promised a Problem Details body.

## Headers and security

- Content-Type matches the actual representation; Accept may include application/json and application/problem+json. Missing Accept or */* uses supported defaults. Strict 406 negotiation is optional and must be specified/tested against the adapter, including q-values and wildcards; do not build a custom parser without need.
- Return server-generated X-Request-Id, matching response metadata and diagnostics. This is a custom project header, not a standardized tracing protocol. Establish correlation before guards/parsing; document adapter-level limits.
- Use Location for created resources. Default authenticated operational responses to Cache-Control: no-store. Caching/ETags/Vary require explicit design.
- Supply Retry-After for throttling or temporary unavailability when a meaningful delay is known. Preserve applicable Allow and WWW-Authenticate.
- Preserve the approved cookie/session, CSRF, origin and trusted-proxy model. Do not add permissive CORS, bearer tokens or client-selected installation headers for generic uniformity.

## Retries and concurrent edits

Assess duplicate submission and lost-update risk per mutation. Define retry key transport/syntax/scope/retention, payload normalization, identical replay, changed-content conflict, concurrent same-key behavior and retained outcomes. Persist mutation/result/retry identity atomically where required. A timeout does not prove failure; safe recovery needs an explicit contract.

Preserve existing Orders body retry keys until migration is authorized. Never accept conflicting body/header keys with unspecified precedence. Preserve expectedRevision plus 409. ETag/If-Match plus 412 is an alternative, not a parallel revision source to add casually. HTTP method idempotence does not guarantee an identical response on replay.

## Client guidance

Optional meta.recommendations uses an explicitly documented discriminated union, added only for concrete workflows. Example intent: `{ "type": "refresh-resource", "resource": "offering", "id": "..." }`. Unknown types are safely ignored; clients own navigation/presentation. No executable code, arbitrary redirects or frontend-store internals.

Return authoritative changed data where practical. Mandatory business state is explicit and enforced server-side; never depend on recommendations for correctness. Metadata supplements protocol headers.

## Diagnostics and audit

Record one structured request-completion event: server request ID, method, route template, status, duration and safe problem type/code. Unexpected failures also include internal diagnostic context once. Expected validation/conflict outcomes normally need no stack. Classify security events deliberately.

Do not log raw bodies, raw URLs/query values, cookies, credentials, tokens or customer payloads by default. Use context allowlists/redaction; verified actor/scope IDs only where justified. Business audit records are separate. Retention/access/destination policy remains separately scoped; no external telemetry is authorized. Distributed tracing is deferred; use W3C Trace Context if later needed.

## Compatibility and documentation

Maintain contracts in owning feature docs. Once authorized machine-readable schemas exist, reference them instead of duplicating payload definitions. OpenAPI tooling/UI remains separately scoped. Field meanings, defaults, validation, ordering, pagination, statuses and problem identifiers are public compatibility concerns. Clients tolerate additive response fields; strict request validation remains. New required request fields are incompatible.

## Sources and authority

Standards: [RFC 9110 HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html), [RFC 9111 caching](https://www.rfc-editor.org/rfc/rfc9111.html), [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html), [RFC 6585 additional statuses](https://www.rfc-editor.org/rfc/rfc6585.html), [RFC 6901 JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901.html), [RFC 8141 URNs](https://www.rfc-editor.org/rfc/rfc8141.html), [W3C Trace Context](https://www.w3.org/TR/trace-context/).

[Google AIP-158 pagination](https://google.aip.dev/158) is organizational guidance, not a universal REST standard. Envelope, parameter names, numeric limits, correlation header and client recommendations are project choices.
