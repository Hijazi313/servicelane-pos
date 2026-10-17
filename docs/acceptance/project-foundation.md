# Project Foundation — Acceptance record

Status: accepted for the schema-free development foundation on 2026-10-12 by user instruction to close the phase. [Specification](../planning/project-foundation/spec.md#acceptance-examples) owns the revised criteria; [phase tracker](../planning/project-foundation/phase-tracker.md) owns detailed evidence and history.

## Evidence accepted now

- API and Drizzle config typechecks passed.
- Watch-mode synthetic check passed initial start, successful-change restart, compile-error gating and recovery. User ran the actual server.
- TLS-switch configuration checks passed defaults, explicit values and invalid-value rejection. Source review covers required configuration and sanitized errors.
- Hosted database authentication and read-only Drizzle SELECT 1 passed. After correcting the pool timeout, GET /health returned 200 with `{"status":"ok"}`. Earlier connection failures returned the defined 503; unknown route returned 404.
- Offline CREATE/corrective DROP SQL generation and journal checks passed using temporary artifacts that were removed. No database migrations or data writes ran.
- Setup, development watch mode and explicit migration instructions are documented.

## Deferred checks and limits

- First real schema migration: fulfilled subsequently by user-authorized BA-01 staging acceptance on 2026-10-12: reviewed/applied first SQL, repeatability and controlled additive-DDL transaction rollback verified. [BA-01 evidence and limits](../planning/business-access/phase-tracker.md#closeout--2026-10-12). This does not prove backup/restore or future destructive-migration recovery.
- Before deployment: verify graceful API shutdown/session release, outage recovery, provider connection mode/budget. PostgreSQL 17.11 was subsequently observed during BA-01 acceptance; deployment compatibility still needs confirmation for its selected target. Fresh-checkout installation with pinned tooling remains unverified; observed tooling differed from the pins.
- Before production: enable certificate verification and establish trusted TLS. Current local configuration explicitly bypasses server verification while retaining encryption; this is not evidence of certificate trust.
- Injected error routes and broad network-fault exercises are not foundation exit requirements. Unexpected-error handling and shutdown are source-reviewed rather than operationally proven.

This closeout does not authorize business implementation, select vendor isolation or establish production readiness. Keep secrets out of evidence and use disposable targets for future migration verification.
