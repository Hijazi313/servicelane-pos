# KT-01 PostgreSQL verification — original post-0004 procedure

**Current state (2026-10-25):** the authorized run applied 0005, failed K01 and verified owned cleanup with sixteen empty tables and six intact history entries. The commands below describe the historical post-0004 run and must not be rerun against this target. Connection-tracking/failure-reporting repair is offline-verified only; a reviewed post-0005 procedure and fresh execution authorization are still required. See [current result and repair](phase-tracker.md#kt-02-harness-repair--2026-10-25).

Historical preparation authorization: preparation/offline harness checks/local commits only (2026-10-25). **No database access or execution is authorized.** [Tracker](phase-tracker.md) owns status; [specification](spec.md#acceptance-criteria) owns KT-A01–06. OR-01 remains accepted/closed. Historical Orders/Menu runners and ledgers are not reused as execution permission.

## Proposed target and baseline gates

Use only a user-designated, exclusively reserved disposable testing database, never production. The configured target is not assumed current or empty. No provisioning or connection is performed during preparation.

1. Separately authorize a read-only baseline inspection. The runner compares two connection identities (database/role/server address/port, distinct backend PIDs) in read-only transactions and emits a sanitized target fingerprint. Require exact migration 0000–0004 hashes/timestamps, the 0004 snapshot's fifteen public application tables/types/constraint names, all counts zero, and no unexpected public functions, triggers or non-table/index objects. Roll back/release both connections. Unexpected data means stop, not reset/delete.
2. Review the baseline report and explicitly approve its fingerprint, target and unchanged exclusive reservation for one execution. Execute mode repeats the full baseline before writes; stale/mismatched identity/history/shape/counts refuses. Require the repository journal to contain exactly 0000–0005 and application/migration URLs to agree; reject production environment configuration. Runtime must be existing Node 24 >=24.21; no installation fallback.
3. Apply only pending 0005 using existing Drizzle machinery. Verify six history entries, sixteen empty application tables, Kitchen constraints and its generated sequence/default before fixtures. Migration 0005 remains applied even after a failed case; no down migration, DROP, TRUNCATE or history deletion. An ambiguous migration result stops before fixtures and before automatic cleanup.

The identity fingerprint detects accidental changes, not production suitability or exclusive access. Human target selection/reservation supplies those gates. Types/constraint-name inspection is not proof of equivalent constraint expressions; real cases provide bounded behavioral evidence.

## Bounded run

One synthetic business, two owned branches (one active), administrator and staff with current-branch grants, two ephemeral sessions, three Menu offerings and six captured orders (five active-branch orders plus one foreign-branch control). No real customer data. Accounts/business/branch/offering/order ownership is recorded in a restricted unique local ledger; no credentials or raw session/CSRF proofs enter it. No second installation, binding switch or operational provisioning.

| Case | Required observations |
| --- | --- |
| K01 — durable dispatch/retry, KT-A01–03/06 | Hold the first real ticket insert before commit. From the second pool, attempt the same order; observe its advisory-lock wait with blocking PID, release and await both. Same ticket, one committed row, original actor and snapshot; retry after discarding the response and direct same-scope adapter insert return the original. Independent SQL verifies preparation JSON; fixed size/extra/combo oracle includes 3 × 2 = 6 components and no nested monetary/customer/policy fields. Orders history stays unchanged. |
| K02 — rollback, KT-A02/06 | Test-only store decorator inserts then throws inside the authorized transaction. Independent SQL sees no ticket; initiating session activity is rolled back and Orders snapshot survives. Remove injection and retry once successfully. No production adapter edits, database trigger or permanent failure hook. |
| K03 — state contention, KT-A05 | Hold real queued→preparing update before commit while staff retries expected revision 0 on connection two; require observed lock wait and one logical transition. Advance to ready with the second actor. Verify separate dispatch/start/ready actor/time stamps, revision 2, unchanged attribution on immediate retry and rejection of delayed preparing retry. |
| K04 — queue/scope, KT-A01/04 | Four committed active-branch tickets across two fenced pages; dispatch a fifth between pages and require it only on a new scan. Persist a real foreign-branch order/ticket and demonstrate API/read exclusion; wrong-business adapter read of a real ticket returns absent. Queue summaries omit full preparation content. |
| D01 — fresh process, KT-A02/04 | Close both parent pools. One fresh Node/Nest process uses real adapters and protected Kitchen controllers with in-memory HTTP injection: read all five exact tickets, redispatch the ready order without reset, enumerate pages and deny the foreign ticket. Close child, reconnect parent and compare all tickets independently. No listener, browser, transport/TLS, database-server restart or crash/backup recovery claim. |

At most two case connections. Statement timeout 30s, lock timeout 20s, contention observation deadline 10s; fresh child deadline 30s with bounded input/output, exact success marker, zero exit and kill/reap on timeout. Barriers always release and contenders settle before cleanup. Idle errors retained through shutdown fail parent/child. Existing source/offline evidence is reused; no broad suite or old acceptance runner execution.

## Owned cleanup and evidence

After fixture setup was attempted and migration verified, cleanup acquires the existing Access lock and validates business/branch/account names/IDs, session digests, binding, offering identities and order/ticket ownership. Unexpected ownership or unrelated policy/global Access rows stops cleanup; no broader deletes. Delete only fixtures under the ledger's business/known accounts in dependency order. Retain the migrated schema and all six history entries; independently require sixteen empty application tables afterward. An unknown committed order not in the ledger stops cleanup for review. Retain the ledger/report on any mismatch; no automatic retry/resume.

Report: source/compiled/harness/migration hashes, runtime/TLS setting, target fingerprint, baseline/history/counts, per-case passed/failed/not-run, contention observations, fresh-process result, cleanup/history and sanitized failure stage/category/SQLSTATE. Local reports/ledgers use unique names and mode 0600. Raw assertions, database URLs, driver messages, raw proofs and synthetic customer details are suppressed. Publish only a separately reviewed sanitized report; both older untracked ledgers remain untouched. Passing exit status alone is insufficient; all five case observations, zero idle/close errors and successful cleanup are required.

Stop on baseline mismatch, material harness defect, unexpected data, missing contention proof, ambiguous commit/migration, failed assertions, child/idle failure or failed cleanup. Normal run-owned cleanup after a known case failure is allowed; unknown ownership is not. No rerun, loosening gates or extra migration is implied.

## Prepared commands — do not run without separate authorization

Fresh compile once with already installed tooling before the authorized baseline/run; no application suites or installation:

```sh
/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node apps/api/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --outDir apps/api/dist/orders-check --sourceMap false
```

Read-only gate (requires its own approval):

```sh
KT01_MODE=baseline KT01_TEST_TARGET=YES KT01_EXCLUSIVE=YES /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/kt01-acceptance.mjs
```

One execution, only after reviewing the baseline and replacing the refusal placeholder with the approved fingerprint:

```sh
KT01_MODE=execute KT01_TEST_TARGET=YES KT01_EXCLUSIVE=YES KT01_EXPECTED_TARGET='REPLACE_WITH_APPROVED_64_HEX_FINGERPRINT' /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/kt01-acceptance.mjs
```

Flags are refusal controls, not authorization. If the runtime is absent, compiled source changes, target reservation changes or the baseline fails, stop for a revised decision. `.env` is read only during separately authorized execution, never preparation.

## Preparation evidence and limits

Seven focused offline preparation checks pass: parent/child refusal before config loading; read-only identity mismatch release; child marker/exit/timeout/overflow; barrier restoration/settlement on observation failure; real Kitchen controller/adapters composition with zero connection calls; K01/K02 fixture/orchestration using existing rollback-capable doubles; ownership rejection before cleanup deletes. Test-only duplicate-insert behavior was aligned with the real adapter's ON CONFLICT semantics. Syntax/link/whitespace checks are preparation evidence only. K03/K04/D01 orchestration and full baseline/migration/cleanup success remain unexecuted on PostgreSQL. No application implementation, migration or dependency changed. Feature acceptance, KT-02 activation, database execution and publication remain separate decisions.


## Offline harness repair — 2026-10-25

The contender's Access transactions now set `application_name` transaction-locally before acquiring the existing advisory lock, avoiding reliance on a startup label surviving hosted transaction pooling. No application source, timeout, lock or acceptance gate changed. Reports add case/step identifiers, per-failed-case contention observation and allowlisted network/domain/harness codes while suppressing raw messages/proofs. Missing write barriers and unobserved contention have distinct safe codes. This improves identification and diagnosis; it does not establish the cause of the historical K01 failure or prove successful PostgreSQL concurrency. Nine focused offline checks pass, including real Access lock ordering, refusal on marker failure, safe diagnostics and barrier settlement. No database run performed for this repair.
