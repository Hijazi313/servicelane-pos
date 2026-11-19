# Frontend testing workflow

Status: repository workflow, 2026-11-01. Applies the existing [verification policy](../project-scope.md#verification-policy); it does not authorize tooling installation, database access, credentials, infrastructure or production actions. Playwright is not currently installed or configured in `apps/web`.

## Select the smallest useful check

1. Identify the changed behavior, risk and acceptance criterion in the existing feature task or tracker. Reuse current evidence where it still applies; do not rerun checks merely because a task changed hands.
2. Use the smallest existing check that can detect the relevant failure: typecheck for type/wiring changes; focused logic or component checks for isolated behavior; a browser journey when real rendering, navigation, focus or browser behavior matters. A build is justified for a build/configuration change, explicit acceptance criterion or unresolved build concern—not every edit.
3. Add a test only when it covers meaningful behavior or a plausible regression not already covered at a suitable level. Do not duplicate assertions across layers or create suites for trivial styling and documentation edits.
4. Record the command, result and material limitations in the owning tracker. Stop after sufficient checks pass; expand only for a failure, changed scope or unresolved risk. No test or mocked browser run proves deployment, physical-device behavior or operational recovery.

## Playwright when justified

- First identify the journey, observable outcome, target browser/viewport and evidence needed; check whether existing tools already cover it. Before adoption, review a compatible version, browser installation and CI cost within authorization. Do not install Playwright or browsers solely because this plan exists.
- Prefer one independent test per meaningful behavior and isolated browser contexts. Use accessible roles and labels and web-first assertions; rely on Playwright's actionability checks instead of fixed sleeps or implementation-specific selectors. See [Playwright best practices](https://playwright.dev/docs/best-practices).
- Choose explicit test boundaries: **mocked browser** verifies rendered client behavior for specified responses; **integrated browser** exercises the real API, cookies and origin over trusted same-origin HTTPS on a specifically authorized safe target. Label evidence accordingly. Mocking a successful login does not prove session security or connectivity.
- Never use real staff/customer data. Use synthetic accounts and isolated data only where target and writes are authorized. Avoid persisting browser state by default; if reuse becomes necessary, keep it outside version control and protect and remove it after use. Storage state can contain impersonation-capable cookies; see [Playwright authentication guidance](https://playwright.dev/docs/auth).
- Capture screenshots, traces or video only when needed to diagnose a failure or satisfy a defined visual criterion; they can contain sensitive data. Avoid uploading or committing them by default. Reuse an existing local server only after confirming its identity and target; do not automatically launch the API against an unknown database or bypass HTTPS/certificate checks.
- Exercise desktop and tablet layouts when the changed behavior depends on them; viewport emulation is not proof of physical touchscreen behavior. Choose the smallest supported-browser matrix once target browsers are agreed. Record actual devices and omissions.

## Ownership and upkeep

- Feature specifications own intended behavior and acceptance criteria; integration guides own consumer-facing contracts. A test plan links to these sources instead of copying full product rules. The owning tracker records assignments, current status, actual evidence and limits.
- Keep executable tests with the feature or journey they verify; put cross-feature journeys with their natural workflow owner. Use a feature's existing tracker for a short plan, or a focused `test-plan.md` when the plan needs its own document. Do not create a product-wide catalogue of all cases or an empty plan for each feature.
- In the same change as behavior, contract or tooling updates, the responsible agent checks affected acceptance criteria, integration guidance, executable tests, test plan, capability index and tracker; update only the artifacts whose owned information changed. Add, revise or remove cases when justified, and preserve historical results as dated evidence instead of rewriting them as current.
- At handoff, identify what was checked, unrun required evidence, and the next action in the owning tracker. A link or a prior passing result does not prove current coverage. For shared workflow or test infrastructure changes, check affected feature plans and links for stale instructions.
