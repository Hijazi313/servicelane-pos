# KT-02 PostgreSQL verification — prepared post-0005 procedure

Authorization: procedure/harness preparation, focused offline checks and local commits only (2026-10-25). **No new database access or execution is authorized.** [Tracker](phase-tracker.md#post-0005-preparation-activation--2026-10-25) owns scope; [specification](spec.md#acceptance-criteria) owns KT-A01–06. OR-01 remains accepted/closed; Kitchen acceptance is separate.

The earlier run applied 0005, failed K01 and verified owned cleanup with sixteen empty tables and all six history entries. Its reports and ownership ledger are preserved. Current state is not inferred from that historical observation. This procedure supersedes the consumed post-0004 procedure for the existing target; there is no migration path in the prepared runner.

## Target and baseline gates

Use only the user-confirmed intended disposable testing database, exclusively reserved for the entire new run. Renew that confirmation with the new authorization; identity, schema and emptiness must still be freshly verified. No provisioning or connection is performed during preparation.

1. Record explicit permission for fresh compilation, the read-only baseline and conditionally one fixture/case/fresh-process/owned-cleanup execution. If the user explicitly permits using the fresh passing fingerprint, no further approval is needed between baseline and execute; otherwise obtain approval of that fingerprint before writes. Previous run permission is consumed.
2. Require `KT01_SCHEMA=post-0005` plus the existing mode/testing/exclusive flags before any configuration or driver imports in parent/child. Require existing Node 24 >=24.21, a non-production environment and identical application/migration URLs. There is no installation fallback or target switch. Record existing TLS verification setting without changing it or claiming TLS assurance.
3. In two repeatable-read read-only transactions, compare database/role/server address/port, require distinct backend PIDs and confirm read-only mode. Emit a sanitized identity fingerprint. Verify exactly migration 0000–0005 hashes/timestamps against the unchanged journal/sources, the 0005 snapshot's sixteen public tables/column types/nullability/constraint names, the Kitchen sequence/default, and no unexpected public functions, triggers or non-table/index objects. Require every table count zero. Always roll back/release both clients. Unexpected data means stop, not reset/delete.
4. Review the passing report, then supply its fresh fingerprint to execute mode. Execute repeats the full baseline before fixture writes; stale/mismatched identity/history/schema/counts refuses. The runner marks migrations `retained-verified`; **it never imports/invokes a migrator or changes schema/history**. Recheck table emptiness under the existing fixture Access lock. Retain 0005 and all six history entries after owned cleanup; no down migration, DROP, TRUNCATE, history edit or broader deletion.

The fingerprint detects identity changes, not production suitability or exclusive reservation. Snapshot/type/constraint-name inspection is not a proof of equivalent constraint expressions or every index property; the unchanged strict gate plus real cases supply bounded evidence. Kitchen sequence values need not restart at one after cleanup; queue checks use observed positions and fences. No sequence reset is permitted.

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

After fixture setup was attempted and the installed post-0005 baseline verified, cleanup acquires the existing Access lock and validates business/branch/account names/IDs, session digests, binding, offering identities and order/ticket ownership. Unexpected ownership or unrelated policy/global Access rows stops cleanup; no broader deletes. Delete only fixtures under the ledger's business/known accounts in dependency order. Retain the migrated schema and all six history entries; independently require sixteen empty application tables afterward. An unknown committed order not in the ledger stops cleanup for review. Retain the ledger/report on any mismatch; no automatic retry/resume.

Report: source/compiled/harness/migration hashes, runtime/TLS setting, target fingerprint, baseline/history/counts, per-case passed/failed/not-run, contention observations, fresh-process result, cleanup/history and sanitized failure stage/category/SQLSTATE, safe case/step/allowlisted code and per-case contention state. Local reports/ledgers use unique names and mode 0600. Raw assertions, database URLs, driver messages, raw proofs and synthetic customer details are suppressed. Publish only a separately reviewed sanitized report; all three existing ownership ledgers remain untouched. Passing exit status alone is insufficient; all five case observations, zero idle/close errors and successful cleanup are required.

Stop on baseline mismatch, material harness defect, unexpected data, missing contention proof, ambiguous commit/migration, failed assertions, child/idle failure or failed cleanup. Normal run-owned cleanup after a known case failure is allowed; unknown ownership is not. No rerun, loosening gates or extra migration is implied.

## Prepared commands — do not run without separate authorization

Fresh compile once with already installed tooling before the authorized baseline/run; no application suites or installation:

```sh
/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node apps/api/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --outDir apps/api/dist/orders-check --sourceMap false
```

Read-only gate, only under the new run authorization:

```sh
KT01_SCHEMA=post-0005 KT01_MODE=baseline KT01_TEST_TARGET=YES KT01_EXCLUSIVE=YES /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/kt01-acceptance.mjs
```

One execution, only after every baseline gate passes and the refusal placeholder is replaced with its freshly verified fingerprint under explicit conditional authorization:

```sh
KT01_SCHEMA=post-0005 KT01_MODE=execute KT01_TEST_TARGET=YES KT01_EXCLUSIVE=YES KT01_EXPECTED_TARGET='REPLACE_WITH_APPROVED_64_HEX_FINGERPRINT' /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/kt01-acceptance.mjs
```

Flags are refusal controls, not authorization. If the runtime is absent, compiled source changes, target reservation changes or the baseline fails, stop for a revised decision. `.env` is read only during separately authorized execution, never preparation.

## Offline preparation evidence and limits — 2026-10-25

Eleven focused preparation checks pass on existing Node v24.21.0. The post-0005 synthetic catalog/history check passes the expected sixteen-empty-table/six-entry baseline and rejects eleven mutations: missing/extra migration, altered hash/timestamp, unexpected table, wrong column type, missing constraint, trigger, absent sequence, wrong sequence default and a nonempty Kitchen table. Both clients roll back/release on success/refusal; modeled statements are read-only. Parent/child refuse old or missing acknowledgements before configuration/driver loading. Source check confirms no migrator import/call in the parent. Existing refusal, connection-free HTTP composition, K01/K02 orchestration, child/barrier lifecycle and ownership-refusal checks still pass.

Contender Access transactions set `application_name` transaction-locally before the real Access lock. Offline checks prove label ordering and refusal if marking fails; safe reports retain case/step, per-case contention observation and allowlisted codes, never raw driver messages/proofs. This does not confirm the historical K01 cause or prove hosted pooling/locking behavior. No environment loading, database connection, PostgreSQL cases, fresh API process against PostgreSQL, installation or publication occurred in preparation. Existing historical reports/ledgers remain unchanged.

## Required authorization for one run

Use the repository continuation-prompt format; the following is a proposed authorization, not active permission:

```text
Resume KT-02 from docs/planning/TRACKER.md and the Kitchen tracker's current
handoff. Follow AGENTS.md and spec-driven-delivery; verify checkout.

I approve the prepared post-0005 database-acceptance.md procedure. I confirm
the configured target is the intended disposable testing database and is
exclusively reserved for this entire run.

Authorize fresh compilation, one read-only baseline and, only if every gate
passes, one execution of the prepared K01–K04/D01 cases with synthetic fixtures,
one fresh API process and owned cleanup. Use the freshly verified fingerprint
to continue without another approval between baseline and execution. Apply no
migrations; require exact 0000–0005 history/schema and sixteen empty tables.
Retain 0005 and verify all sixteen tables empty with intact history afterward.

Stop on mismatch, material harness defect, ambiguous commit, missing contention
proof or failed cleanup. No automatic retry, gate relaxation, broad deletion,
old Menu/Orders runner execution, installation, provisioning, deployment,
publication or later workflow. Preserve evidence/ledgers and pending incident
reviews. Local evidence/documentation commits only. Record observed results,
cleanup, evidence limits and the next decision; passing tests do not accept Kitchen.
```
