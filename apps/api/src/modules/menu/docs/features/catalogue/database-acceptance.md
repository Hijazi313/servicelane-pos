# MN-01 bounded database acceptance — prepared, unrun

Owner: primary agent. [Tracker](phase-tracker.md#database-acceptance-preparation--2026-10-18) owns authorization/status; [acceptance criteria](spec.md#acceptance-steps) own behavior. Harness: [mn01-acceptance.mjs](../../../../../../tests/mn01-acceptance.mjs); fresh API probe: [mn01-restart.mjs](../../../../../../tests/mn01-restart.mjs). Preparation does not authorize execution or accept MN-01.

## Target and stop gates

Proposed target: **the one existing disposable test database selected by the repository-root `.env`**, previously used by the passing [MN-00 report](../../../../../../tests/evidence/mn00.062f6e66-871f-4d22-b040-376c2ac0659d.json). No second database. Its current configuration/identity has not been read or contacted during preparation. `MN01_TARGET=existing-env-disposable` acknowledges this target; it is not proof of human authorization.

Before execution, the user must confirm this remains disposable, unchanged and exclusively reserved for this run. Stop other application instances, migrations and writers for the entire window. This is an execution prerequisite, not a claim that the harness prevents every external writer. Do not print credentials or connection URLs. Preserve existing TLS configuration; the previous report records `tlsVerified=false`, so this is development evidence, not verified server-identity or production transport evidence.

The harness refuses before configuration/import/connection unless both opt-ins and Node >=24.21.0 <25 are present. Once separately authorized, its first database operations are two repeatable-read, read-only transactions:

- Require application and migration connection strings to be identical. Require distinct backend PIDs but matching database/role/server address/port, and the fingerprint to equal the reviewed MN-00 report. An address/role change also stops execution; investigate rather than loosen the gate.
- Require exactly the ten prior application tables in `public`, all empty; no Menu tables. Require exactly migration history 0000–0002, with hashes and timestamps matching checked-in artifacts; local journal must contain exactly 0000–0003.
- Compare column names, types, nullability and constraint names with `0002_snapshot.json`. This supplements history checks; it is not exhaustive drift detection (constraint expressions, triggers, privileges and functions are not audited).
- Stop on any mismatch, unexpected data, connection/visibility failure or timeout. No fixture cleanup runs for a rejected baseline because no fixture writes were attempted. A sanitized run report records the failed gate.

Recheck all thirteen application tables empty inside the serialized fixture transaction after migration. Do not reuse old execution permissions. No broad BA/MN-00 revalidation, installation or operator provisioning/recovery CLI.

## Migration and fixtures

The harness uses the existing Drizzle migrator after the gate. Exactly `0003_menu_catalogue.sql` is pending: three Menu tables, their keys/checks and three ownership FKs; one migration-history row. The migrator's existing `CREATE ... IF NOT EXISTS` history/schema initialization also runs. No previous application migration should execute. Verify four history entries, the new hash/timestamp, thirteen tables, empty data and the 0003 structural snapshot before fixtures.

The migration remains applied after success or later-case failure. **Rollback below means failed application transactions, not schema downgrade.** No DROP/TRUNCATE, down migration, history deletion, backup/restore, provisioning or deployment is included. A failed/ambiguous migration stops the run; do not blindly retry. A second run will fail the pre-migration gate and needs a separately reviewed resume procedure/authorization.

Fixtures are synthetic only: unique `mn01.<UUID>` business/branch/admin labels, PKR/Asia/Karachi business configuration, random hashed password (never printed or retained), two in-memory session/CSRF proofs, two ordinary items with one variant each, and one combo with a fixed component and one required 1/1 choice. All IDs are generated; no restaurant identity or real records. Fixture creation uses existing Business/Access transaction operations, not the operator bootstrap command. Three deliberately invalid ownership inserts run in transactions expected to abort. No permanent test triggers, functions or probe tables.

## Cases and expected observations

These are phase P0 acceptance gaps: deferring them would leave real persistence, atomicity and concurrent prices unverified. Existing eight Menu offline checks and accepted MN-00 evidence are reused; no repeated domain/HTTP suite. Sized/extras, currency precision, role/CSRF denials and min/max permutations are already covered offline and are not retested here.

| Case | Criteria | Required observation |
| --- | --- | --- |
| M01 | Persistence prerequisite | Only 0003 applied; history/schema checks above pass; all tables initially empty |
| P01 | AC01a/b database portion, AC01c ownership | Real service/store save/read preserves complete definitions, IDs, PKR scale/revision; two variant identities and one deduplicated reference edge; all three ownership FK violations reject with SQLSTATE 23503 |
| R01 | AC05e | Inject failure **after** real store writes: once after item revision/variant insertion, once after combo revision/edge replacement. All three Menu tables and initiating session activity exactly equal pre-operation state; original injected error preserved |
| C01 | AC05a | Two real authorized transactions submit same item revision; observed waiting contender, first commits revision 2, second returns 409; winner remains persisted |
| C02 | AC05b | Controlled overlapping edits on separate items both commit their expected next revisions |
| C03 | AC05c, AC03d | Save-first: combo save commits, dependency deactivation follows; combo hidden and resolve returns 409. Reactivate synthetic dependency, then deactivate-first: queued combo save returns 409 and combo definition/revision remains unchanged |
| C04 | AC05d and coherent reads | SELECT started while combo update is uncommitted returns the complete old definition (650 + 30). After commit, snapshot resolves 700 + 45 = 745. A subsequent overlapping resolution POST waits for the authorized writer and returns complete new 800 + 55 = 855; no mixed totals |
| P02 | AC01b | Two successive fresh Node/Nest API processes initialize, serve protected definition GET and resolution POST through HTTP injection using real adapters, and close. Both see identical complete persisted IDs/revisions/configuration and total 855; parent re-read matches |

Concurrency uses at most two pool connections. Every ordered contender must be observed in `pg_locks`/`pg_stat_activity` waiting on the first transaction's advisory lock, identified by transaction-local application name and blocking PID. Missing observation fails the case; elapsed time alone cannot pass it. Deadlines: contention observation 10s, lock timeout 20s, statement timeout 30s; restart child deadline 30s (15s statement/10s lock timeout). Each contender settles before cleanup. Close the second pool before restart children; one child runs at a time.

P02 restarts the real Menu controller/guard/filter/services with explicit test composition and no background access timer, listener, browser or production HTTPS. It proves fresh-process API persistence, not packaged AppModule startup, deployment, database-server restart, crash recovery or installation recovery. Those broader release checks remain deferred. P1 expansion (load/fuzz campaigns, broader currency/HTTP reruns, schema downgrade tooling) is unnecessary for this bounded development acceptance and is not authorized.

## Run-owned cleanup and evidence

Before fixture writes, save a unique restricted-mode ledger with tag/account/session digests; business/branch IDs are saved before setup commits. Raw proofs/passwords/URLs are never written. Offering IDs are recorded after creation; cleanup ownership is the synthetic business ID plus checked business/branch/account labels and Menu name prefix. The exclusively reserved empty target makes all records under that run business owned by the run.

In `finally`, settle contenders/child, acquire the existing access advisory lock, verify ledger ownership, then transactionally delete that business's Menu references → variant identities → offerings, the two ledger sessions, grant/credential/account, installation binding, branch and business. No unscoped deletion. Then require all thirteen application tables empty, four migration-history rows retained and the 0003 structural shape intact. Close pools. An idle connection error fails the run.

On ownership mismatch or cleanup failure, stop and retain ledger/report; do not broaden deletes. If interrupted before `finally`, use the ledger for read-only ownership investigation under new authorization; do not relaunch or infer cleanup success. No automatic retry/resume/cleanup-only mode. Retain unique sanitized reports/ledgers locally for review; commit only reviewed sanitized reports, never raw diagnostics or environment files. Reports retain source/compiled artifact hashes, runtime, target fingerprint, case results, failure stage/SQLSTATE and final counts. A passed case is not user acceptance; failures leave MN-01 active.

## Proposed execution commands — require new authorization

From repository root, use the already-existing isolated runtime, if still available. No download/install fallback. Compile once immediately before execution to avoid stale generated imports; this is a preparation freshness gate, not a repeat of the passing test suite:

```sh
/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node apps/api/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --outDir apps/api/dist/menu-check --sourceMap false
MN01_ACCEPT_STAGING=YES MN01_TARGET=existing-env-disposable /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/mn01-acceptance.mjs
```

Inspect the new report and cleanup result before any follow-up. Do not run the normal migration CLI separately: migration belongs after this harness's gate. No commands in this section have been executed during preparation.

Exact next authorization: **approve one execution of this reviewed procedure on the existing `.env` disposable MN-00 test target, exclusively reserved and unchanged, including its initial read-only gates, only pending migration 0003/history update, synthetic Business/Access/Menu fixture writes, two-connection controlled cases, two fresh API probe processes, run-owned cleanup and sanitized evidence retention.** No installation, infrastructure, deployment, push, PR, merge or automatic retries. MN-01 acceptance remains a separate user decision after evidence review.
