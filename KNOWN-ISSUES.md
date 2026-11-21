# Known issues

This is an index of selected cross-application issues and their current evidence, not an exhaustive defect list. Feature trackers remain authoritative for feature-specific requirements and acceptance. Record confirmed observations separately from hypotheses and proposed actions; an entry does not authorize implementation or change existing contracts.

## KI-01 — Slow authenticated workflows on the development database

**Status:** Open; performance investigation deferred. **Affected:** Menu setup is observed; other authenticated workflows may be affected but have not been measured.

**Impact and evidence:** On 2026-11-21, the user reported slow Menu creation and refresh. API completion logs for two saves showed CSRF bootstrap taking 5.9–7.2 seconds and Menu POST taking 7.8–10.2 seconds. The three subsequent listing/context requests overlapped; the slowest completed in 15.4–19.5 seconds. Five read-only simple queries on the configured remote development database took approximately 288, 291, 292, 348 and 1,000 ms. These are observations on one development target, not production benchmarks. The [Menu closeout](docs/planning/frontend/initial-menu-setup.md#acceptance-and-closeout--2026-11-21) owns workflow evidence and limits.

**What is known:** Each save obtains CSRF proof before writing; the refresh requests definitions, active offerings and context. Access transactions use a shared installation-local advisory lock, and authentication and Menu operations make multiple database round trips. Earlier cold connections approached or exceeded the old 2.5-second pool timeout; the timeout was increased and a local login subsequently succeeded. The `Server-Timing` header reports aggregate API time, not the time spent in each stage.

**Hypothesis, not confirmed cause:** Remote query latency and serialized access work contribute to the delay. Existing evidence does not quantify lock wait, individual authorization/database stages or performance of other workflows. The intended deployment topology uses a local database; no local-installation performance claim has been verified.

**Proposed next actions:**

1. Measure connection acquisition, lock wait, authorization and Menu operations for representative requests without logging credentials, tokens or customer data. Establish a comparison baseline and agreed target before selecting changes.
2. Evaluate reusing the session-bound CSRF token in memory to avoid repeated bootstrap requests, including refresh, logout, session rotation and failure handling. The server must continue validating proof and origin on every mutation.
3. Investigate redundant access and refresh work and lock contention. Preserve server-side authorization, transactional revocation guarantees, concurrency behavior and existing API contracts; verify those invariants for any proposed change.
4. Compare against an authorized representative local deployment. Test other workflows before claiming a product-wide impact or improvement.

No performance fix or new verification is authorized by this record. Reconcile this entry with the owning tracker when work is actually completed.

## KI-02 — Kitchen queue cursors do not survive API restarts

**Status:** Open; existing Kitchen contract unchanged. **Affected:** Kitchen queue pagination.

**Impact and evidence:** The [Kitchen cursor implementation](apps/api/src/modules/kitchen/application/kitchen-queue-cursor.ts) creates a random signing key per service instance. A cursor from before a restart or from another instance is rejected; the client must start a fresh first-page scan. The [Kitchen specification](apps/api/src/modules/kitchen/docs/features/preparation/spec.md#rest-api-adoption--2026-10-25) documents this behavior, and the [focused test](apps/api/tests/kitchen.test.mjs) covers a newly created service instance. A real deployment restart is not established by that test.

**Proposed next action:** When Kitchen pagination is migrated, assess a stable shared signing key, key rotation, client recovery and compatibility with the finite queue scan. A contract change and its verification require separate authorization.
