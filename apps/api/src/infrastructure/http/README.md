# Shared HTTP boundary

Reusable components verified through the [offline harness](../../../tests/http-prototype/README.md). Registered through bootstrap and AccessHttpModule for GET /api/v1/menu/offerings, POST /api/v1/orders and all four Kitchen ticket routes (Kitchen adoption 2026-10-25). Other methods remain unmarked and preserve legacy bodies/statuses. Kitchen’s dated baseline and evidence are in its [capability index](../../modules/kitchen/docs/capabilities.md#rest-api-adoption). Follow the [wire convention](../../../../../docs/architecture/rest-api-convention.md); migrations require explicit contract approval.

| Component | Responsibility |
| --- | --- |
| HttpContract | Method-level opt-in to the new success/error contract |
| HttpContractGuard | Capture the opt-in before Access admission; no authorization logic |
| DtoValidationPipe / EmptyQueryDto | Nest ValidationPipe with strict concrete DTO validation, nested transformation and safe body/query/path field errors; empty DTO rejects all query keys |
| HttpResponseInterceptor | Wrap marked ordinary JSON results and explicit HttpPage results with page metadata; leave unmarked results and 204 unchanged |
| HttpContractFilter / writeProblemDetails | Compose module error mapping with shared formatting and an explicit legacy fallback |
| createHttpAdapter | Server-generated IDs, early response headers and safe completion-event callback |

## Integration order

When an endpoint migration is authorized:

1. Create the adapter through createHttpAdapter using validated body/proxy settings and a nonthrowing, secret-safe completion reporter.
2. Register HttpContractGuard before existing Access guards. Register HttpResponseInterceptor once.
3. Compose HttpContractFilter with the owning semantic-error policy and legacy fallback. Local filters must call the same writer/filter; Nest filters do not chain. Avoid competing global catch-all filters.
4. Mark only normal JSON methods whose response/error migration is approved. Bind concrete DTO classes through `@Query(new DtoValidationPipe("query"))`, `@Param(new DtoValidationPipe("path"))` or `@Body(...)`. Orders receives CreateOrderDto through the shared pipe and calls OrdersService.create for application/domain normalization. No specialized capture pipe is needed. Do not import DTO classes with import type.
5. Preserve transactional authorization in application code and select public response fields deliberately.

Request-ID setup must precede marked handling. The method marker alone does not initialize correlation. Root-relative problem identifiers use the approved /problems/<code> rule. Problem mappings and safe typed details belong to approved module HTTP contracts; this infrastructure neither invents identifiers nor serializes arbitrary exception objects. Configure a single nonthrowing diagnostic reporter through HttpErrorPolicy. It receives the original error for internal diagnostics and must redact secrets. The shared error policy reports safe request ID/error-kind diagnostics; bootstrap reports completion metadata, including known problem codes. It deliberately omits raw exception messages/stacks that may contain secrets. Log destination/retention remain operational follow-ups.

## Deliberate limits

Only normal JSON and 204 are supported for opt-in. Leave health, streams, downloads and direct reply.send handlers unmarked until separately designed/tested. Explicit HttpPage results produce data arrays and meta.page.nextCursor (including final null). Controllers own page construction; cursor generation/verification remains application-owned (Kitchen uses its scoped codec). Automatic response sanitization, post-header recovery and a general header-forwarding framework are not implemented. The error policy preserves protocol headers only when explicitly mapped (Retry-After is supported). Authentication challenge/Allow and cookie scenarios require focused migration tests.

Types do not validate a mapper's runtime details. Each mapper must select its safe payload and test it. Existing snapshot byte limits remain application-owned. Focused actual-controller and harness checks prove selected lifecycle/formatting behavior with synthetic stores, not database concurrency or deployment readiness.

## DTO validation adoption — 2026-10-25

Pinned class-validator 0.15.1 and class-transformer 0.5.1. HTTP inputs use the shared Nest ValidationPipe configuration: transform true, implicit conversion false, whitelist and forbidNonWhitelisted true, and target/value excluded from validation diagnostics. Body DTOs use forbidUnknownValues true. Query validation uses Nest's false default to support the intentionally empty query DTO; root shapes and unknown keys are still rejected explicitly. Reserved keys silently skipped by class-transformer are rejected before transformation. Errors return `/problems/validation-failed`, code VALIDATION_FAILED, and safe body/query field paths and constraint codes. No input values/default messages are echoed.

The generic ValidatedInputPipe was removed. Existing application/domain parsers remain for non-HTTP boundaries and canonical business normalization; they are not an alternative HTTP validation integration. A class-transformer DTO does not sanitize responses automatically.

## BP-01 isolated source adoption — 2026-10-26

Five Billing and two Business display controller methods opt into the same components in source. BillingModule composes them but is deliberately absent from AppModule; there is no live route activation. Focused offline HTTP injection covers all seven routes, strict DTOs, envelopes, safe semantic failures, Location and no-store/correlation. Existing global guard/interceptor/filter registration remains unchanged; accepted upstream contracts/evidence were not rerun. [Owning evidence and persistence gaps](../../modules/billing/docs/features/settlement/phase-tracker.md#bp-01-delivery-evidence--2026-10-26).
