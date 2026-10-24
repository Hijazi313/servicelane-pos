# Offline shared HTTP prototype

Test-only Nest/Fastify module exercising the [shared infrastructure](../../src/infrastructure/http/README.md) with real Menu/Orders application services and the existing synthetic Orders fixture. Never imported by AppModule or main. No database, environment loading, network listener or new dependency. HTTP runs through Fastify inject.

From repository root, using a supported Node 24 runtime (>=24.21.0):

```sh
node apps/api/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --outDir apps/api/dist/orders-check --sourceMap false
node --test apps/api/tests/http-prototype/pattern.test.mjs apps/api/tests/http-prototype/logging.test.mjs
```

Stop if compilation fails; do not test stale output. Generated files stay in ignored dist directories. The harness now calls the extracted TypeScript parseOrderCapture function; no duplicated JavaScript parser remains. Compilation covers shared and module TypeScript source.

## Historical prototype observations — 2026-10-24

Strict compilation and all five test groups passed on the existing bundled Node v24.22.1. An initial development run on v24.18.1 is not the final supported-runtime evidence.

- Real Menu active catalogue list: unchanged raw arrays versus opt-in envelopes, empty results, undeclared/duplicate query keys rejected.
- Real Orders capture: normalization, saved replay, concurrent same-key replay under the fixture's serialized access model, changed payload rejection, price-confirmation details, CSRF and origin denial.
- Invalid structural input rejected before application/store calls. Independent parser agrees with production on one normalized valid body and five invalid bodies; this is not exhaustive equivalence.
- Marked guard/pipe/module/unexpected errors use shared Problem Details; unmarked controllers retain existing errors, including legacy unexpected 503.
- Server-generated correlation ignores spoofed incoming IDs, matches envelopes/errors and captured completion/diagnostic records. Retry-After preserved; marked 204 has no body.
- Malformed JSON, oversized body and unmatched routes retain legacy formatting. Serializer failure before headers returned a safe marked 500 problem once, without a leaked BigInt message.
- A snapshot at the existing byte limit fits the saved-snapshot contract while its envelope exceeds that size. This demonstrates overhead, not a new response cap.

## Important finding

Reading handler metadata from exception ArgumentsHost did not work in the tested Nest path. HttpContractGuard captures the marker before AccessBoundaryGuard, without making authorization decisions. The filter uses captured request context; the interceptor can still inspect ExecutionContext. Registering these guards in the opposite order would break marked guard-error formatting.

## Limits

No production routes/filter/bootstrap changed. No database concurrency, actual parser extraction, typed application-input migration, pagination, client migration, performance or release proof. No post-header streaming failure/termination test. Diagnostics are captured in memory, not delivered through a production logger. No general header-forwarding/health/download/stream coverage; Retry-After, no-store, JSON media and 204 were the exercised cases. The problem URL is an example domain. Source output fields were compared to the existing catalogue/snapshot contracts; this is not a repository-wide data-exposure audit.

The fixture serializes access in memory; its concurrency result does not prove PostgreSQL behavior. Production's duplicate structural parsing remains intentionally unchanged. Next decision: review the experiment, then authorize bounded extraction/migration if desired; do not deploy or register these prototype classes globally.

## Shared-component promotion — 2026-10-24

After user continuation authorization, the proven boundary moved into src/infrastructure/http with role-specific filenames; this harness now imports those production-source components. Removed the duplicated test boundary.ts. Extracted correlation hooks into createHttpAdapter; moved example problem URLs and diagnostic collection into test-owned policy, so shared source contains neither example identifiers nor an in-memory log collector.

Fresh strict project compilation and the same five groups passed on Node v24.22.1 after promotion. No AppModule/bootstrap/controller registration changed. Application parser extraction and production logger wiring remain pending; these are reusable source components exercised offline, not endpoint adoption.

## First endpoint integration — 2026-10-25

Production source now registers the shared components for GET /api/v1/menu/offerings and POST /api/v1/orders. This is source integration, not deployment. Actual controller tests verify the approved contract; unmarked probe routes retain legacy comparisons. Root-relative /problems/... types are user-approved. Application parsing is extracted for shared application/domain normalization; the subsequent DTO adoption below defines the current HTTP validation path. Production completion logging includes safe problem codes; unexpected diagnostics omit raw secret-bearing messages/stacks. logging.test.mjs verifies the production reporter's redaction policy.

Earlier statements above about unregistered source and absent parser extraction describe the historical prototype checkpoint. Current limits remain synthetic persistence, no PostgreSQL rerun, no post-header streaming recovery and no broad client/release acceptance.

## Nest DTO validation — 2026-10-25

The user subsequently selected Nest ValidationPipe with class-validator 0.15.1 and class-transformer 0.5.1. The harness now exercises that integration; the generic parser-adapter pipe is removed. Nested DTO/unknown-field/coercion/null/replay checks are in orders-http.test.mjs. Application normalization still protects all callers. Libraries were pinned with pnpm 12.11.2; its in-place add hit the existing pnpm9 modules-layout mismatch, so only manifest/lockfile resolution was performed there. New libraries were verified through isolated dependencies linked into apps/api/node_modules. Five isolated dependency versions/integrities match the pnpm lock and frozen lockfile-only verification passed. Lifecycle scripts never ran. Existing unrelated node_modules was not rebuilt; a normal future pnpm install can recreate dependencies from the checked-in lockfile.
