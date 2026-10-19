# Authentication/Access capability index

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Initial administrator provisioning | [AdministratorProvisioner via public.ts](../public.ts) | Store administrator, credential hash and explicit branch grant | Operator bootstrap only; accepted shared transaction/Business validation preserved; forced-change enforcement now provided by BA-02 source |
| Identity/password validation | [validators via public.ts](../public.ts) | Normalize usernames and validate credentials | Lowercase ASCII username; 15–128 Unicode-code-point passwords without trimming; no privilege/foreign identity input |
| Authentication and staff access | [AccessService via public.ts](../public.ts) | Login/session/CSRF lifecycle, scoped staff administration and explicit context/action checks | Server-resolved installation, current grants/status; short serialized transactions and hashing outside locks; source and scoped persistence checks; remaining backend verification and conditional future-client checks deferred |
| Transactional consumer authorization | [AccessService.runAuthorized via public.ts](../public.ts) | Validate current role/grant/session/CSRF and await a consumer operation in the existing locked transaction | Explicit staff/administrator policy; trusted installation and opaque scope only; bounded awaited DB work, no nested access calls; focused offline and single-target PostgreSQL rollback/ordering evidence; user-accepted 2026-10-18 under the recorded development scope |
| Shared HTTP access boundary | [http/public.ts](../http/public.ts) | Reuse route policy decorator, proof extraction and request type | Global guard/filter remain in AccessHttpModule; mutation CSRF is validated by runAuthorized; no duplicate cookie parser or guard stack |
| Local administrator recovery | [recover-administrator command](../../../operator/recover-administrator.ts) | Reset existing administrator credentials and revoke sessions | Hidden terminal input, OS process identity, explicit business/account; no HTTP recovery route; host authorization/runbook and database execution separately required |

See the [module overview](README.md) for boundaries and links to specifications and delivery evidence.
