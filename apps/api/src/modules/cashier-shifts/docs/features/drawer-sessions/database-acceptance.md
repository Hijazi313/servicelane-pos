# CS-02 PostgreSQL verification — preparation in progress

[Phase tracker](phase-tracker.md) owns authorization and status; [acceptance scenarios](spec.md#acceptance-examples-for-the-proposed-increment) define the intended behavior. This document is a design for an unprepared run, not permission or an executable procedure. Do not connect, migrate or create fixtures until an executable harness has been completed and reviewed and the user identifies and exclusively reserves a disposable target. Prior BP-02 execution permission was consumed and does not transfer.

## Baseline and execution boundary

Use synthetic fixtures only. The intended pre-0007 gate requires the exact seven history entries through 0006, the 0006 schema and 20 empty application tables; post-migration requires eight entries through 0007 and 26 empty tables. [Offline manifest](../../../../../../tests/cs02-plan.mjs) derives exact hashes and schema names from repository sources; it is not a database collector. A future collector must independently verify target identity through two read-only transactions, expected catalog structure and empty counts. A fingerprint detects target drift but does not prove the database is disposable or exclusively reserved. Stop on mismatch, unexpected data or unclear migration outcome. Apply only 0007 once after the reviewed baseline; preserve migration and history, never reset or repair them automatically.

## Required bounded evidence

| Case | Required observation | Acceptance |
| --- | --- | --- |
| C01 | Two independent open drawers in one branch; one-open-drawer and one-custodian uniqueness, scope isolation and original-key replay | CS-A01, A05 |
| C02 | New Billing payment and cash attribution use one transaction; injected failure after each write leaves neither; same-key retry creates one of each | CS-A02 |
| C03 | Observe actual Access-lock contention for settlement versus close and handover; payment is included before transition or rejected after it; if a preformed close loses to payment, stale revision must reject and a refreshed close includes it; replay after transition returns the original bill | CS-A03, A07 |
| C04 | Exact float, payments and movements reconcile on close; negative variance and reason retained; closed state rejects new operations | CS-A04, A06 |
| C05 | Administrator and configured closing authority, revoked recipient/replacement, wrong business/branch and durable retry identity are enforced using current access | CS-A05, A08 |
| C06 | A fresh process reads and replays committed synthetic results, including a synthetic legacy bill seeded through a reviewed fixture path; original bill and cash history remain unchanged | CS-A03, A06 |

Require observed PostgreSQL lock waits rather than timing guesses for C03. Test-owned failures must occur inside the real authorized transaction. Model response loss using a known committed result; do not claim proof of ambiguous COMMIT recovery or database-server crash recovery. Physical custody, fiscal compliance and correction workflows remain outside this verification.

## Harness and cleanup still to prepare

The source-derived baseline collector, fixture setup, ownership ledger and cleanup guards, test runtime and child lifecycle have focused mock-based offline checks. Implement and offline-test the execution runner, independent row-capture integration, case orchestration, contention barriers and fresh-process check. Record exact fixture IDs and row digests before cleanup; delete only rows proven to be run-owned. Refuse cleanup on unexpected or changed rows, target drift or unverified ownership. Use secret-safe reports and never retain credentials, tokens or connection strings. Stop after any failure or ambiguity; do not automatically retry or relax gates. Define exact execution controls and supervised commands only after the harness exists and is reviewed.

Preparation evidence so far: `node --test apps/api/tests/cs02-plan.test.mjs` passed two offline checks for the source-derived 20→26 manifest and refusal of inconsistent observations. No database, environment configuration or migration runner was accessed. The admission function consumes an observation; it does not create or verify one and cannot authorize execution.

Additional preparation on 2026-10-29: 13 offline tests passed for the manifest, dual read-only catalog collector against mock clients, fixture/ledger refusal paths, source composition and child lifecycle. The bounded catalog comparison does not prove constraint or index expression equivalence, default expressions, actual PostgreSQL execution, fixture cleanup or runtime safety. No database or configuration access occurred.
