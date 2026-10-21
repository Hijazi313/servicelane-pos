# Authentication/Access

Owner: primary agent. BA-01 bootstrap was accepted on staging. BA-02 now supplies source for lifecycle, HTTP authentication/access and local recovery; BA-02 was user-accepted on 2026-10-17 under revised development scope; remaining backend verification and conditional future-client checks are recorded in the joint tracker. Intended rules: [specification](features/access/spec.md). Authorization/evidence: [joint tracker](../../../../../../docs/planning/business-access/phase-tracker.md).

## Public capabilities

See the [capability index](capabilities.md) for supported entry points and reuse constraints.

Authentication owns accounts/credentials/grants, sessions, pre-login CSRF state, throttle counters and minimal security events. Business identity and current bound branch are resolved through Business public operations in the same opaque transaction; no Business table imports. Fixed installation-local advisory locking serializes authentication transactions, including last-administrator changes and sensitive authorization rechecks. Hash work runs outside those short transactions. No cache or JWT authority, cross-module deletes, generic repository framework or permission engine.

The private Node Argon2id adapter preserves BA-01 PHC parameters (19 MiB/two passes/one lane, 16-byte random salt, 32-byte output), supports bounded verification with timing-safe comparison and limits concurrent hashes to two with no queue. The API remains experimental; pinned-runtime compatibility and target-host performance are release gates. No dependency installation was needed. [Node API](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoargon2algorithm-parameters-callback).

HTTP composition is separate from operator composition. The internal [route decorator](../http/access-entry.decorator.ts), [global guard](../http/access-boundary.guard.ts), [exception filter](../http/access-exception.filter.ts) and [transport types/helpers](../http/access-http.helpers.ts) separate HTTP responsibilities; application authorization remains in `AccessService`. These are not supported cross-module exports. New routes use `/api/v1`; `/health` remains technical. HTTP startup requires canonical HTTPS `CLIENT_ORIGIN`; proxy forwarding is trusted only for explicitly configured IP addresses. Cookies always remain Secure/HttpOnly/SameSite=Strict. No TLS, asset hosting, CORS client mode or Swagger is supplied. Detailed route/payload semantics and acceptance limits are in the specification.

## Consumer authorization integration

[MN-00](features/access/spec.md#mn-00--transactional-module-authorization) supplies source for supported transactional reuse of the existing fixed-role RBAC plus business/branch checks for Menu. It extends the existing authorization system; the source capability has focused offline and bounded single-target PostgreSQL evidence; user acceptance recorded on 2026-10-18. [Delivery tracker](../../menu/docs/features/catalogue/phase-tracker.md) owns MN-00 → MN-01 gates and MN-00 source/offline-check authorization; BA evidence remains closed under its recorded scope.
