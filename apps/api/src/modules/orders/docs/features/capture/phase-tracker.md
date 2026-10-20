# Order capture — Phase tracker

Specification: [spec.md](spec.md). Owner: primary agent. Active phase: OR-01. Status: awaiting acceptance (source/offline increment; persistence execution not authorized).

## Authorization — 2026-10-20

User explicitly authorized OR-01 source implementation, narrow supported transactional Menu consumer, necessary migration source files without execution, affected docs, focused existing offline checks and local Conventional Commit checkpoints. No installation, database access/migration execution, provisioning, deployment, push, PR mutation or merge. Preserve local README commit 42825d1 and untracked MN-01 ledger. Solo assignment covers Orders and its necessary Menu/composition/migration consumers.

## Active tasks

| Task | Status | Exit evidence |
| --- | --- | --- |
| Menu consumer and exact snapshot contract | implemented | OR-A02/A03/A05; focused offline tests below |
| Capture/read/settings and persistence source | implemented, PostgreSQL unverified | OR-A01–08; compile and focused application/HTTP tests below |
| Migration source and documentation | implemented | 0004 generated and parsed offline; no database execution |

## Completion shape

Capture/read and business-scoped limit settings, no dispatch/payment/fiscal totals. Offline evidence cannot establish PostgreSQL persistence/concurrency/restart behavior or user acceptance. These remain pending under OR-A04/A06 and require separate target-specific execution authorization. Operational personal-data policies and full trading flow remain deferred in the specification.

## Evidence — 2026-10-20

- Full TypeScript project compilation to the existing ignored check-output pattern passed with the pre-existing supported Node 24.21.0 runtime; no installation or configuration loading.
- [Orders application tests](../../../../../../tests/orders.test.mjs) and [actual HTTP tests](../../../../../../tests/orders-http.test.mjs): 13 passed in the final combined run after the injectable-file naming and type-dependency cleanup. Actual Authentication/Menu services run against substituted transactional persistence. Covered current role/session/grant/CSRF enforcement, scoped reads, exact configured/combo amounts, immutable optional customer/instruction snapshots, price-conflict resubmission, JSONB-key-order-insensitive replay after Menu/policy changes, concurrent attempts, injected rollback, safe errors and body/expanded-response limits. Boundary helper checks include inclusive/one-byte-over and multibyte JSON. These are offline observations, not PostgreSQL concurrency/recovery evidence.
- Existing Drizzle generator produced [0004_order_capture.sql](../../../../../../migrations/0004_order_capture.sql), journal and snapshot offline. `readMigrationFiles` parsed all five migrations; snapshot comparison established all 13 prior table definitions unchanged, with only captured_orders/order_capture_policies added. Source constraints include scoped retry uniqueness, retry-key format, basic JSON identity and policy bounds. No migration execution or database access.
- Existing Menu database acceptance/report and ledger remain historical and unchanged. No old harness run, broad suite or production build performed. Source-import/export review found no foreign persistence imports, new RBAC, decimal/precision duplication, nested authorization or query-builder exposure. The broader transport-boundary assurance is retracted; see [INC-20261020-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-01--domain-http-status-coupling-carried-into-orders-and-missed-at-handoff).

## Availability and remaining acceptance

OR-A01/02/03/05/07/08 have focused offline behavioral evidence; storage behavior uses a substitute. OR-A04 has offline serialized duplicate/rollback evidence but PostgreSQL uniqueness/commit ambiguity/rollback/concurrency remains unverified. OR-A06 fresh-process durable readback is not executed. All user acceptance is pending; no complete trading or release claim. The aggregate stores lines in one JSON snapshot, avoiding independently mutable line records.

## Handoff

- Source: Orders application/domain/controller/filter, owned schema/adapter/module, narrow Menu consumer, composition and generated migration. Docs: canonical specification/capabilities; discovery is a transition reference only.
- No push or PR mutation performed. Draft PR #10 remains at verified 0083da0; unrelated README commit 42825d1 is preserved locally. Ledger remains untracked and excluded.
- Next: review the local source/offline increment. To obtain persistence acceptance, separately authorize a reviewed target-specific OR-01 procedure, fresh compilation, migration application, synthetic fixtures, bounded concurrency/restart/failure cases and owned cleanup. Do not infer permission to use the migrated Menu target or rerun its harness. Backend development acceptance/rescoping, if desired, needs an explicit user decision.
- Operational customer retention/erasure, full kitchen/payment/fiscal workflow and release validation remain separate from this development increment.
- Incidents: [INC-20261020-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-01--domain-http-status-coupling-carried-into-orders-and-missed-at-handoff). Existing incident reviews remain unchanged; no skill/template/guardrail edits.

## Uncommitted boundary correction — 2026-10-20

User authorized the Menu/Orders error-boundary correction under existing guidelines and explicitly prohibited commits pending personal verification. Scope: semantic MenuError reasons and OrdersError codes without HTTP status members; exhaustive status mapping in Menu HTTP helper/Orders filter; affected callers, docs and focused tests. No source changes to Authentication's accepted error contract, schema, money, pricing or retry behavior. No commit, staging, push, PR mutation or database access.

Compilation passed to both existing check-output directories with the pre-existing supported Node 24.21 runtime. The four affected Menu/Orders application/HTTP files passed all 25 tests, including actual HTTP mapping coverage for all nine Menu reasons and all thirteen Orders codes. Domain assertions require absence of the status member; public HTTP statuses, safe response bodies, no-store headers and reconfirmation details are preserved. Three direct Menu-error assertions in the old MN-01 harness were adapted to reason names and syntax-checked only; historical execution evidence/ledger unchanged, no harness execution.

Correction evidence: [INC-20261020-01](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-01--domain-http-status-coupling-carried-into-orders-and-missed-at-handoff). Source correction is verified offline; incident remains open to user review, not closed. Next: user reviews the uncommitted diff and decides whether to accept/commit it. PostgreSQL and broader operational acceptance remain pending as above.

Process review: [INC-20261020-02](../../../../../../../../docs/quality/agent-incidents.md#inc-20261020-02--documented-constraints-were-read-but-not-enforced-when-reusing-code) owns the separate user-requested assessment of documented-rule enforcement. Open; no instruction/skill/guardrail edits or commit authorized by this record.

## Local correction commit authorization — 2026-10-20

User explicitly requested committing the existing correction and incident documentation before later architecture-check work. This supersedes the earlier no-commit restriction only for this checkpoint. Existing compilation/25-test evidence is reused; subsequent inspected source changes are formatting-only. Incident closure, new checks/guardrails, database work, push and PR mutation remain unauthorized.
