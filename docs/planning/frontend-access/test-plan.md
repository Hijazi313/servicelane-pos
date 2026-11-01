# Frontend access — candidate browser test plan

The [access tracker](phase-tracker.md) owns execution and evidence; [specification](spec.md) owns acceptance behavior and [integration guide](frontend-integration.md) owns the API mapping. The [existing API-client tests](../../../apps/web/tests/access-api.test.mjs) use synthetic responses; they do not render the UI or verify a real API. If Playwright is adopted, candidate focused browser checks are:

1. **FE-A01/FE-A02/FE-A05 — mocked UI:** unauthenticated startup displays login; valid synthetic response displays the home; denied credentials display safe feedback. Verify labeled controls and keyboard access where relevant.
2. **FE-A03/FE-A04 — mocked UI:** restricted account remains out of the home and can access password change; a lost response shows an unknown outcome and requires session recheck. Include logout only where it adds distinct coverage.
3. **FE-A01–FE-A04 — integrated browser:** on an explicitly authorized isolated test environment with trusted same-origin HTTPS and synthetic account, exercise CSRF bootstrap, login, refresh, restricted password change where safely provisioned, logout and rejected access afterward. Plan test-account ownership, writes and cleanup before execution. Verify browser cookies and the actual contract; do not reuse mock evidence for this gate.

These are candidate acceptance checks, not permission to create accounts, change passwords, start a backend against an unspecified target, install certificates or run database operations. Resolve the HTTPS setup and target authorization before integrated execution.
