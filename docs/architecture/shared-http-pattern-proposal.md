# Shared HTTP pattern proposal

Status: proposed architecture with a user-authorized offline prototype completed on 2026-10-24; [observed results and limits](../../apps/api/tests/http-prototype/README.md). Production migration and dependency selection remain unapproved. The [canonical convention](rest-api-convention.md) owns wire rules. This document proposes their implementation, not another contract standard.

## Mental model and ownership

Parse external structure once → coordinate an authorized operation → enforce business rules → persist owned data → select public fields → format HTTP.

| Owner | Responsibility | Excludes |
| --- | --- | --- |
| Shared technical HTTP boundary | Common query primitives, validation integration, envelope/problem formatting, request correlation | Business filters, domain rules, module persistence |
| Module HTTP | Input contracts, permitted filter/sort fields, public response selection, semantic-error mapping | Transaction orchestration and raw database access |
| Application | Typed operations, authorization, transaction/retry coordination, cross-module public calls | Fastify request/reply and HTTP statuses |
| Domain | Invariants and finite semantic outcomes/errors | Headers, DTO decorators and protocol concerns |
| Persistence adapter | Scoped parameterized queries, constraints, locks, stored-value mapping | Generic client-directed query execution |

Place shared technical implementation under `apps/api/src/infrastructure/http/` when approved, matching existing infrastructure ownership. Use normal Nest providers; no base controllers, generic repository, decorator framework or query DSL.

## Existing source traces

### Bounded listing: GET /api/v1/menu/offerings

Existing Access guard → [controller](../../apps/api/src/modules/menu/http/menu.controller.ts) resolves trusted context → [MenuService.list](../../apps/api/src/modules/menu/application/menu.service.ts) → owned store snapshot → active catalogue view. Source limits catalogue creation to 500 offerings. No declared query DTO or pagination exists. Administrator definitions remain a different representation/access policy.

Use this as the bounded-list exception; do not introduce filtering/pagination merely to demonstrate primitives. Proposed migration: an empty strict query contract rejects undeclared keys, an application-facing operation resolves context, public types select the existing approved catalogue fields, and an opted-in envelope wraps the list. Rejecting formerly ignored query keys and wrapping the array are compatibility changes requiring approval. The offering count limit is not a proven total serialized response-byte bound.

This listing cannot prove pagination primitives; their proof remains deferred until an actual approved paginated workflow exists, or a separately authorized isolated synthetic HTTP probe. Kitchen implementation is on its separate local branch and is deliberately not imported here.

### Mutation: POST /api/v1/orders

[Controller](../../apps/api/src/modules/orders/http/orders.controller.ts) → [OrdersService.create](../../apps/api/src/modules/orders/application/orders.service.ts) parses unknown input → runAuthorized performs current access/CSRF checks and invokes the consumer transaction → scoped retry lookup compares canonical payload → Menu resolver checks current price/composition → snapshot/save → controller returns saved snapshot. [HTTP tests](../../apps/api/tests/orders-http.test.mjs) assert raw snapshot responses, price-conflict details and safe 503 fallback.

Preserve retry-key normalization, stored replay identity, currency/money semantics, scope and atomic behavior. Extract pure structural parsing only after inspecting all callers. Keep the parser framework-independent and directly callable by non-HTTP entry points; the pipe adapts it rather than becoming its only owner. A module-owned Nest pipe calls that parser and returns typed input; domain normalization/invariants remain reusable and enforced for non-HTTP callers. Do not move catalogue reads, authorization or price checks into a pipe. Existing application tests/callers currently pass raw payloads, so changing the application signature needs a bounded caller migration, not duplicate validation wrappers.

Response mapping explicitly preserves the approved snapshot fields; error mapping preserves actionable price-confirmation details. Envelope/error/status migration and any response-size implications need separate acceptance. Existing 201 replay behavior must not silently change during formatting.

## Proposed Nest integration

1. **Validation:** retain existing pure validators initially and use supported PipeTransform integration. No class-validator, class-transformer or schema package is currently declared. First extract one existing parser without changing semantics; do not hand-write a new universal validation framework. Compare a library only if concrete nested-contract maintenance justifies dependency authorization. DTOs describe validated input; annotations alone prove nothing.
2. **Queries:** share only demonstrated scalar/array/date parsing mechanics and defaults. Module contracts compose supported keys and allowlists. Check duplicate scalars before parser normalization loses them. No generic BaseQueryDto with every module's filters. No speculative cursor codec until needed.
3. **Success:** module mapping owns fields; a shared interceptor owns the envelope for explicitly opted-in normal JSON routes. Use one small metadata decorator to distinguish migrated routes, not property-name heuristics. Handler-owned typed page metadata, when needed, uses one explicit internal result contract; the interceptor never computes counts/cursors. Preserve 204/header-only results and health/files/streams. Direct reply.send routes need deliberate migration.
4. **Errors:** module-scoped filters map semantic errors and delegate to the same shared Problem Details writer. A shared fallback handles framework/Access/unknown errors. Register module mappers through normal DI, not a plugin registry. Nest filters do not chain: a local filter must invoke shared formatting itself. Production Access catch-all remains unchanged during the isolated prototype. For eventual adoption, replace its registration atomically with a compatibility-aware fallback that preserves legacy branches and adds migrated behavior; do not add competing catch-all filters. Preserve Retry-After, cookies and applicable protocol headers. Resolve the controlled problem URL base before publishing identifiers.
5. **Correlation/logging:** configure supported Fastify request-ID generation and early header setup; response completion logs use route templates and safe context. Always generate the identifier server-side with genReqId and explicitly disable incoming request-ID adoption (requestIdHeader: false). Keep exception diagnostics single-owned and distinguish pre-controller/parser failures from interceptor coverage. Verify installed adapter behavior before promising malformed-request coverage.
6. **Access:** reuse AccessEntry/guard/proof. Guards precede pipes; keep that admission order. Application runAuthorized remains authoritative for transactional mutations. No new authentication scheme or client-selected tenant context.

## Compatibility and error transition

One explicit route contract marker selects both new success formatting and Problem Details. Interceptors inspect route metadata; a metadata-only guard captures its value on the request before Access admission, and filters read that captured value. The prototype showed handler metadata was absent in exception ArgumentsHost. Guard failures cannot depend on an interceptor having run. No dual media types, request-header flags or global enablement are proposed.

| Surface | Existing behavior | Proposed opted-in behavior | Known affected consumers/evidence |
| --- | --- | --- | --- |
| Menu listing | Raw array, no declared query validation | data/meta envelope; reject undeclared query keys | menu-http.test.mjs asserts raw empty array |
| Orders capture/replay | Raw snapshot, 201 | Same snapshot under data, 201 preserved | orders-http.test.mjs reads top-level id and compares readback |
| Access/guard rejection | Legacy statusCode/message, Retry-After when applicable | Problem Details; preserve status and applicable headers | Menu/Orders/Access HTTP harnesses |
| Module rejection | Existing module-specific error bodies | Problem Details with approved safe typed details | Price-confirmation and revision/error assertions |
| Unexpected request failure | Global Access filter currently emits safe 503 | Safe 500 problem and single-owned diagnostics | Orders HTTP failure test currently expects 503 |
| Unknown consumers | Not inventoried by this assessment | No compatibility claim | Identify actual clients/environments before accepted-route migration; Kitchen source remains on its own branch |

For unchanged routes retain current success/error shapes and statuses. For marked routes use the new format for Access, pipe, module and unexpected failures. Module filters delegate to shared formatting explicitly; they do not rethrow expecting the global filter to format the same exception. Typed expected-unavailability errors remain 503; unexpected exceptions are 500 only in the migrated contract.

Prototype these branches in a separate offline Nest test module, not production AppModule/bootstrap registration. Use unmarked and marked harness routes to compare behavior. Any metadata absent because routing has not matched (including 404/malformed requests before route selection) uses the legacy safe fallback initially; request correlation is included only where the adapter has established request context. Matched marked-route failures must not silently fall back to legacy formatting.

No current global filter changes until explicit runtime migration authorization. The later replacement must preserve technical health and legacy behavior before any endpoint is opted in. Public problem identifier base and consumer impact remain approval gates.

## Lifecycle and diagnostic boundary

```text
Fastify request creation: server-generated ID → early response-header setup
  → Nest middleware → guards → interceptors (inbound) → pipes
  → controller/application → interceptors (outbound) → serialization/response

Uncaught Nest request failure → applicable local OR global filter → response
Adapter/parser/serialization failure → verified adapter error path
```

Filters are failure handlers, not a success stage and not a chain. Guards run before interceptors; error formatting uses the marker captured before Access admission, not interceptor execution or assumed handler metadata in the exception context. Detached asynchronous/process failures are outside this request pattern. Verify the installed adapter path for parsing/serialization errors rather than assuming Nest filters cover it.

Minimum completion-event fields: requestId, method, route template (null when unmatched), status and duration; safe problem type/code when available. Unexpected exceptions have one diagnostic owner. Never substitute the raw URL or body when route metadata is absent.

## Serialization and size policy

Keep Orders' existing 1,048,576-byte saved-snapshot limit unchanged. Measure complete serialized envelope bytes separately; do not reinterpret that stored-state safeguard as a response cap. Menu's 500-offering count bound likewise does not establish a response-byte cap. Choose any new total response limit only with contract/acceptance review, not an arbitrary shared constant.

The prototype must observe envelope overhead and inject a serialization failure. Before headers are sent, attempt one minimal safe failure through the verified adapter/Nest path; after response transmission starts, do not attempt a second JSON response. Record safe diagnostics and use supported adapter termination behavior. Avoid recursive error serialization. Public DTOs must exclude unsupported values such as raw bigint; exact monetary strings remain unchanged.

## Proposed proof before rollout

These are future execution criteria, not passing results:

| Case | Required observation |
| --- | --- |
| Listing | Authorized existing fields, bounded empty/nonempty result, unknown query rejected only under approved contract |
| Validation | Original normalization/limits preserved; malformed payload rejected before application operation |
| Mutation | Current authorization/CSRF/price/retry behavior preserved; no store work after structural rejection |
| Formatting | One envelope, no leaked fields, correct 204/technical exclusions and media types |
| Errors | Same Problem Details writer for local semantic, guard, pipe and fallback paths; safe unexpected 500 |
| Correlation | Server-generated header/body/log identifier matches, spoofed incoming ID ignored; guard/pipe/adapter coverage observed separately |
| Compatibility | Marked and unmarked routes tested for Access, module, framework and unexpected failures; unmatched fallback remains explicit |
| Serialization | Snapshot limit preserved, full envelope overhead measured, safe serializer failure without a second response |

Use current Nest/Fastify inject harnesses and synthetic stores for offline HTTP checks; no database or installation needed merely to prove formatting/pipe lifecycle. Real persistence/concurrency proof remains separately scoped. The authorized isolated prototype now has five passing test groups; see its results/limits. These observations do not migrate accepted endpoints or prove every proposed criterion.

## Smallest next implementation decision

Approve a bounded offline prototype of shared validation integration, envelope/problem writer and correlation, exercised against the two traces with explicit migration contracts. Do not enable globally or migrate accepted endpoints without that approval. Pagination stays deferred. Only after observed results update the skill with the proven Nest pattern and scope CI separately.

Sources: [Nest pipes](https://docs.nestjs.com/pipes), [request lifecycle](https://docs.nestjs.com/faq/request-lifecycle), [interceptors](https://docs.nestjs.com/interceptors), [exception filters](https://docs.nestjs.com/exception-filters), [Fastify request ID generation](https://fastify.dev/docs/latest/Reference/Server/#genreqid). Framework docs describe mechanisms, not proof of this project's runtime behavior.
