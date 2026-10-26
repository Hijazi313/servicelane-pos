# BP-02 persistence verification — completed bounded run

**Execution result — 2026-10-26:** B01–B07 and owned cleanup passed on the user-authorized disposable `.env` target. Only 0006 was applied; twenty application tables are empty and seven exact history entries remain. [Result/evidence limits](phase-tracker.md#bp-02-single-target-execution-result--2026-10-26). Permission consumed; commands below are historical, not approval to rerun. BP-01/BP-02 were subsequently user-accepted on 2026-10-27 under the [recorded limitations](phase-tracker.md#bp-01bp-02-user-acceptance-and-closeout--2026-10-27).

[Authorization and current handoff](phase-tracker.md#bp-02-lean-harness-continuation--2026-10-26). [Acceptance criteria](spec.md#acceptance-criteria). Manual entry: `apps/api/tests/bp02-acceptance.mjs`. The procedure below records the reviewed preparation and execution boundaries; the dated result and acceptance above supersede its unrun/awaiting-acceptance status.

## Smallest useful scope

Verify the financial guarantees that require PostgreSQL. Reuse BP-01 money/DTO/HTTP edge evidence and accepted Orders/Kitchen evidence; do not rerun those suites. No additional Billing feature, operational activation, fiscal/receipt proof, physical-cash claim, server crash or backup/recovery exercise.

The manual harness uses real Access/Billing/Business display/Orders financial adapters. All seven application routes stay unmounted in AppModule. The fresh child composes only the existing Billing controller and shared HTTP guard/adapter/interceptor/filter for in-memory injection; no listener or new HTTP contract. HTTP validation, envelopes, problems, scope and retry semantics remain the accepted specification. Collection/pagination work is inapplicable. Offline HTTP evidence proves only this test composition.

## Baseline and migration gates

1. User identifies the intended disposable testing target/configuration source and renews exclusive reservation for baseline through cleanup. Earlier upstream execution permissions do not apply. No real data or concurrent application/agent workload is permitted. Fingerprints detect identity changes; they cannot establish reservation or target suitability.
2. Review this procedure and exact committed harness. Freshly compile with existing Node 24.21+ and installed dependencies. No installation fallback. Reports hash source, compiled dependency tree, migrations/journal and harness files; changes require renewed review before execution.
3. Baseline mode uses two independent repeatable-read/read-only connections, same database/role/server/port, distinct PIDs and rollback/release. Require non-production configuration and identical application/migration URLs; retain existing TLS setting without changing or claiming assurance. Save only identity fingerprint, not URLs/credentials.
4. Require exactly six migration entries matching unchanged 0000–0005 hashes/timestamps, snapshot 0005's sixteen empty public tables, exact column names/types/nullability and constraint names, expected Kitchen sequence/default and no unexpected public functions/triggers/non-table/index objects. Any mismatch/data means stop, never reset. This bounded gate follows the existing verification approach; it does **not** prove semantic equivalence of every check/FK/index/default expression. B03 separately exercises the new payment uniqueness constraints. No general SQL-equivalence engine is justified here.
5. Execute mode repeats this baseline against the approved fingerprint, then runs existing Drizzle transactional migration with exactly 0006 pending. Explicit `BP02_APPLY_0006=YES` is required. No migration regeneration, older pending migration, down migration, history repair, provisioning or binding switch. Immediately verify seven exact history entries and snapshot 0006's twenty empty tables, including `display_revision` default 0. An already-post-0006 target requires a revised no-migration procedure; do not silently skip migration or reuse permission after a partial run.
6. Retain 0006/schema/history after fixtures are removed. Migration uncertainty stops before fixtures and requires separately authorized read-only reconciliation; never retry a migration automatically.

## Bounded fixtures and cases

Two synthetic businesses, three branches, two active-business actors/admin+staff and two ephemeral sessions; twelve direct synthetic captured-order fixtures (ten active, one foreign branch, one foreign business). No persisted Menu offering is required: captured financial history is immutable and has no live Menu dependency. This is test fixture setup, not an upstream Orders capture test or operational provisioning. Kitchen stays empty. Original Orders snapshots/rows and account/grant/binding/credential digests must remain unchanged across case checkpoints.

Independent oracle: merchandise 10000, optional fixed charge 500, exclusive synthetic 10% tax on merchandise plus selected charge. Payable [] = 11000; selected = 11550. PKR/scale 2 and the sample rate exist only in fixtures. No legal applicability or installed defaults are inferred.

| Case | Core observation |
| --- | --- |
| B01 scope, A01/06 | Real foreign/absent order reads are indistinguishable; selected active order settles to 11550. Direct test-owned foreign aggregates reuse its retry UUID in other scopes; active API/adapter cannot read them. Wrong-scope policy read is absent. Orders digests and empty Kitchen retained. Foreign fixture inserts do not claim authorized cross-business operation. |
| B02 same key, A04/13/16 | Hold actual aggregate insert before commit, start staff contender, require observed wait on holder's real Access lock. Both return exactly one original bill/payment/actor/request. Discard a known response and replay identical key/content; selection change conflicts. This models response loss, not actual ambiguous COMMIT. |
| B03 different keys, A04 | Same proven contention for one order/two keys: one success, one ORDER_ALREADY_SETTLED, one aggregate. Independently attempt duplicate scoped order and scoped retry in rolled-back transactions and require the named uniqueness constraints. No constraint fuzzing or redundant malformed-JSON cases. |
| B04 settings races, A03/09/10/12 | Four schedules: policy-first, settlement-first, display-first, settlement-first. Require real lock wait each time. Edit-first rejects stale assessment without aggregate; settlement-first retains exact old policy/display while later edit commits. One meaningful revision change per schedule; no repeated DTO/no-op/maximum-revision edge cases. |
| B05 atomic rollback, A04/09/10 | Test-only wrappers throw after real settlement insert, policy replacement+history, or display replacement+history, inside original authorized transaction. Independent full owned-state comparison proves no partial aggregate/history/revision/session activity survives. Remove hooks; original failed settlement key succeeds once. No production changes or database triggers. |
| B06 history/retired IDs, A10/13/16/18 | Remove charge+tax rules, change display, unconfigure policy. Original settlement/replay/readback remains identical; changed key content conflicts. Both retired IDs are recovered from durable history and cannot be reintroduced. Verify policy/display history revision chains/actor/time, retained original actor/request/bill and revoked-session denial. No claim of privileged-SQL-proof append-only history. |
| B07 restart, A05/11/13 | Close parent pools; one fresh Node/Nest process reads and replays exact original bill through real protected controller, rejects foreign IDs and retired-ID replacement. Verify envelope/no-store/correlation and replay Location. Child must exit zero with exact marker; reconnect parent for independent readback. No database-server restart, listener or live AppModule activation. |

At most two case connections. Contender sets `application_name` transaction-locally **before** actual Access lock `(20261012,2)`; holder observes its blocker/lock wait before release. SQL 30s, lock 20s, barrier/wait 10s, child 60s; no automatic extensions. Barriers release in finally, all contenders settle before cleanup; timed-out child is killed/reaped. Idle/close errors fail the run. Cases start not-run and stop at first failure; record passed only after independent owned-state checkpoint. No broad suite or generic testing framework.

## Ledger, uncertain outcomes and cleanup

Before fixture transaction, write a unique mode-0600 ledger with planned IDs, target/source/baseline hashes and setup/migration stage; independently certify exact committed row digests after setup and successful cases. Persist only synthetic fixtures and digests, never passwords, raw session/CSRF proofs or connection strings. Proofs reach the child over bounded stdin only. Reports use unique filenames, sanitized stage/category/SQLSTATE, case status, hashes, contention, migration and cleanup results; no raw exception/driver/assertion messages or stderr. All seven historical ledgers/reports stay untouched.

Checkpoint admission validates every populated row's planned identity/scope; all other tables must be empty. Captured Orders/account/grant/binding/credential rows remain byte-equivalent; existing bill and history digests must remain present as new records append. Cleanup acquires the same Access lock, rechecks target and exact full checkpoint state, then deletes only run-owned IDs/businesses in FK order in one transaction. Missing/changed/extra rows, unexpected dependencies or no certified setup state refuse deletion. There is no attempt to infer ownership from a familiar business name.

Cleanup is deliberately conservative: if failure/connection loss changes state after the last successful checkpoint, cleanup may refuse and retain fixtures/ledger for review. Do not update digests merely to make cleanup pass. Normal cleanup after a failure is permitted only when exact certified ownership still matches. Independent final reads require twenty empty public application tables, seven exact history entries and expected schema; never DROP/TRUNCATE/reset sequences or delete migration history.

Stop on baseline/identity/reservation/source drift, unexpected data, material harness defect, assertion/missing contention, child/idle/close failure, migration/commit ambiguity or cleanup mismatch. No automatic rerun, new retry key or gate relaxation. On uncertainty, preserve artifacts and request bounded read-only reconciliation: wait until writer outcome is resolved, inspect known-order/scoped key against original request; only matching saved aggregate proves commit. A failed response or absent read while writer is active does not prove rollback. Partial migration/history mismatch requires owner decision; do not repair/drop/retry. An intentional retry after known injected rollback and exact-key replay after known commit are the only planned repeats.

## Offline evidence and commands

Existing Node v24.21.0: fresh TypeScript compilation passed; fourteen focused preparation checks pass across `bp02-plan.test.mjs` and `bp02-preparation.test.mjs`. Evidence covers source-derived six/16→seven/20 manifests, refusal controls, actual catalog collector on synthetic catalogs, fixture transaction/financial projection shape, barrier/failure-hook lifecycle, ownership refusal/scoped cleanup path and actual-controller child HTTP assertions. No environment loading, database access, migration, upstream suite, installation or publication. These checks do not prove PostgreSQL concurrency/constraints/rollback, hosted child startup, migration outcome or cleanup; those are the single authorized run's job. Full B01–B07 database orchestration remains unexecuted.

Offline preparation commands (no environment file):

```sh
/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node apps/api/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --outDir apps/api/dist/billing-check --sourceMap false
/private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --test apps/api/tests/bp02-plan.test.mjs apps/api/tests/bp02-preparation.test.mjs
```

Historical commands below are **not authorized for another run**. From repository root, fresh compile first, then use the approved existing configuration source (`.env` below is a placeholder until the user confirms it):

```sh
BP02_MODE=baseline BP02_SCHEMA=pre-0006 BP02_TEST_TARGET=YES BP02_EXCLUSIVE=YES /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/bp02-acceptance.mjs
BP02_MODE=execute BP02_SCHEMA=pre-0006 BP02_TEST_TARGET=YES BP02_EXCLUSIVE=YES BP02_APPLY_0006=YES BP02_EXPECTED_TARGET=REPLACE_WITH_APPROVED_64_HEX_FINGERPRINT /private/tmp/mn00-verified-runtime/node-v24.21.0-darwin-x64/bin/node --env-file=.env apps/api/tests/bp02-acceptance.mjs
```

Historical authorization shape (the one-run permission has been consumed):

```text
I approve the BP-02 procedure and harness at [exact reviewed commit].
The target identified as [non-secret database identifier], configured through
[existing configuration source], is disposable and exclusively reserved for
this one run from baseline through cleanup.
Authorize fresh compilation, one read-only pre-0006 baseline, then only if
all gates pass, migration 0006/history and one B01–B07 synthetic verification
run with the fresh fingerprint, isolated HTTP child and owned cleanup.
Continue from baseline without another approval using its verified fingerprint.
Retain 0006 and verify twenty empty tables with seven intact history entries.
Stop under the recorded conditions; ambiguity needs separate read-only
reconciliation permission. No automatic retry, installation, live activation,
real operation, push/PR/merge or deployment. Local sanitized evidence/docs
commits only. BP-01/BP-02 acceptance remains separate.
```

Incidents: none in this continuation; 21 existing pending incident reviews preserved.
