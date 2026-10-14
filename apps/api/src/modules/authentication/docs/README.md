# Authentication/Access

Owner: primary agent. BA-01 bootstrap was accepted on staging. BA-02 now supplies source for lifecycle, HTTP authentication/access and local recovery; required database/browser acceptance remains pending. Intended rules: [specification](features/access/spec.md). Authorization/evidence: [joint tracker](../../../../../../docs/planning/business-access/phase-tracker.md).

## Public capabilities

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Initial administrator provisioning | [AdministratorProvisioner via public.ts](../public.ts) | Store administrator, credential hash and explicit branch grant | Operator bootstrap only; accepted shared transaction/Business validation preserved; forced-change enforcement now provided by BA-02 source |
| Identity/password validation | [validators via public.ts](../public.ts) | Normalize usernames and validate credentials | Lowercase ASCII username; 15–128 Unicode-code-point passwords without trimming; no privilege/foreign identity input |
| Authentication and staff access | [AccessService via public.ts](../public.ts) | Login/session/CSRF lifecycle, scoped staff administration and explicit context/action checks | Server-resolved installation, current grants/status; short serialized transactions and hashing outside locks; source checks only, persistence/browser acceptance pending |
| Local administrator recovery | [recover-administrator command](../../../operator/recover-administrator.ts) | Reset existing administrator credentials and revoke sessions | Hidden terminal input, OS process identity, explicit business/account; no HTTP recovery route; host authorization/runbook and database execution separately required |

Authentication owns accounts/credentials/grants, sessions, pre-login CSRF state, throttle counters and minimal security events. Business identity and current bound branch are resolved through Business public operations in the same opaque transaction; no Business table imports. Fixed installation-local advisory locking serializes authentication transactions, including last-administrator changes and sensitive authorization rechecks. Hash work runs outside those short transactions. No cache or JWT authority, cross-module deletes, generic repository framework or permission engine.

The private Node Argon2id adapter preserves BA-01 PHC parameters (19 MiB/two passes/one lane, 16-byte random salt, 32-byte output), supports bounded verification with timing-safe comparison and limits concurrent hashes to two with no queue. The API remains experimental; pinned-runtime compatibility and target-host performance are release gates. No dependency installation was needed. [Node API](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoargon2algorithm-parameters-callback).

HTTP composition is separate from operator composition. New routes use `/api/v1`; `/health` remains technical. HTTP startup requires canonical HTTPS `CLIENT_ORIGIN`; proxy forwarding is trusted only for explicitly configured IP addresses. Cookies always remain Secure/HttpOnly/SameSite=Strict. No TLS, asset hosting, CORS client mode or Swagger is supplied. Detailed route/payload semantics and acceptance limits are in the specification.
