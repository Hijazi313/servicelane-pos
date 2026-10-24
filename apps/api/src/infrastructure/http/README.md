# Shared HTTP boundary

Reusable components verified through the [offline harness](../../../tests/http-prototype/README.md). They are **not registered in AppModule or bootstrap** and no production endpoint is opted in. Follow the [wire convention](../../../../../docs/architecture/rest-api-convention.md); migrations require explicit contract approval.

| Component | Responsibility |
| --- | --- |
| HttpContract | Method-level opt-in to the new success/error contract |
| HttpContractGuard | Capture the opt-in before Access admission; no authorization logic |
| ValidatedInputPipe | Adapt a module-owned pure parser; parseEmptyQuery supports explicitly empty query contracts |
| HttpResponseInterceptor | Wrap marked ordinary JSON results; leave unmarked results and 204 unchanged |
| HttpContractFilter / writeProblemDetails | Compose module error mapping with shared formatting and an explicit legacy fallback |
| createHttpAdapter | Server-generated IDs, early response headers and safe completion-event callback |

## Integration order

When an endpoint migration is authorized:

1. Create the adapter through createHttpAdapter using validated body/proxy settings and a nonthrowing, secret-safe completion reporter.
2. Register HttpContractGuard before existing Access guards. Register HttpResponseInterceptor once.
3. Compose HttpContractFilter with the owning semantic-error policy and legacy fallback. Local filters must call the same writer/filter; Nest filters do not chain. Avoid competing global catch-all filters.
4. Mark only normal JSON methods whose response/error migration is approved. Bind module-owned parsers through `@Query(new ValidatedInputPipe(parseQuery))` or `@Body(...)`; keep parsers callable independently.
5. Preserve transactional authorization in application code and select public response fields deliberately.

Request-ID setup must precede marked handling. The method marker alone does not initialize correlation. Problem type/title/status mappings and safe typed details belong to approved module HTTP contracts; this infrastructure neither invents identifiers nor serializes arbitrary exception objects. Configure a single nonthrowing diagnostic reporter through HttpErrorPolicy. It receives the original error for internal diagnostics and must redact secrets. Production logger integration remains pending.

## Deliberate limits

Only normal JSON and 204 are supported for opt-in. Leave health, streams, downloads and direct reply.send handlers unmarked until separately designed/tested. Paginated metadata, cursor generation, automatic response sanitization, post-header recovery and a general header-forwarding framework are not implemented. The error policy preserves protocol headers only when explicitly mapped (Retry-After is supported). Authentication challenge/Allow and cookie scenarios require focused migration tests.

Types do not validate a mapper's runtime details. Each mapper must select its safe payload and test it. Existing snapshot byte limits remain application-owned. The harness proves selected lifecycle/formatting behavior with synthetic stores, not database concurrency or production readiness.
