# Authentication/Access

Owner: primary agent. BA-01 implements the initial administrator bootstrap slice only; database bootstrap acceptance passed on staging. No login, session, HTTP staff management or recovery command is implemented. Intended rules and P0/P1 scope: [Authentication/Access specification](features/access/spec.md). Delivery owner: [joint tracker](../../../../../../docs/planning/business-access/phase-tracker.md).

## Public capabilities

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Initial administrator provisioning | [AdministratorProvisioner via public.ts](../public.ts) | Store active administrator, separate password hash and explicit initial branch grant | Operator bootstrap only; one active transaction shared with Business; validates branch through Business public API; forced-change marker persisted but enforcement awaits BA-02 |
| Bootstrap identity/password validation | [validators via public.ts](../public.ts) | Normalize usernames and validate initial credentials | Lowercase ASCII username; 15–128 Unicode-code-point password without trimming; reject privilege/foreign identity input |

Owns staff accounts, credentials and grants. No session tables or speculative access engine. Business/branch IDs are logical cross-module references validated by the Business public capability in the same transaction; authentication never imports Business tables. Its own account/grant and credential relationships have database foreign keys. No cross-module delete operation exists; future deletion/branch changes must preserve references through an explicit ownership design.

The private hash adapter uses Node 24's experimental Argon2 API, with salted Argon2id PHC output (19 MiB, two passes, one lane). [Node 24 API](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoargon2algorithm-parameters-callback) and [OWASP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) inform this selection. This avoids a dependency/native install for the approved bootstrap slice; the adapter must be reviewed against API stability and benchmarked on the target host before release. This is not a password-login implementation or a production-readiness claim.
