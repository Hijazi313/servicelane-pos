# Project scope and working policy

- Build a reusable restaurant POS product intended for rollout to multiple independent restaurant businesses/vendors. Chickano in Faisalabad is the first deployment, not a permanent product limitation.
- The first deployment uses PKR and Asia/Karachi. Restaurant identity, branding, currency, timezone and applicable fiscal settings must come from validated business configuration rather than hardcoded Chickano assumptions. Configurable currency does not imply multi-currency transactions are in MVP scope.
- Support rollout through the same maintained codebase; avoid per-restaurant forks. User approved the initial topology on 2026-10-12: one business per restaurant-LAN installation, dedicated local PostgreSQL, locally served client assets and one maintained codebase. See the [topology record](architecture/vendor-isolation-proposal.md). Operational ownership and recovery targets remain open.
- Establish Business → Branch ownership from the beginning. MVP operation provisions one branch per business; support for operating multiple branches is a confirmed future requirement, including branches in the same or different cities. Branch management, switching, transfers, consolidated reports and synchronization are deferred.
- Project Foundation (R-01–R-05) is closed under the revised development acceptance scope by user instruction on 2026-10-12. BA-01-T01/BA-01-T02 implementation is authorized by explicit user instruction on 2026-10-12; [authorization and limits](planning/business-access/phase-tracker.md#ba-01-authorization--2026-10-12). Hosted development PostgreSQL is user-supplied; no local provisioning or Docker Compose. BA-01 schema/binding and atomic operator bootstrap with the first administrator were accepted on staging and closed on 2026-10-12; no implementation phase is active. Necessary dependency installation is permitted; BA-01 acceptance writes/migration application and test-data cleanup on the configured empty staging database were authorized and completed on 2026-10-12; see the [acceptance authorization](planning/business-access/phase-tracker.md#staging-acceptance-authorization--2026-10-12). Infrastructure provisioning, deployment and later phases remain prohibited.
- Backend first: establish the project foundation before business modules. Business/Branch foundation and Authentication/Access then form the first integrated business milestone, followed by Menu. Authentication and server-enforced authorization are MVP P0. Detailed implementation phases remain to be defined and approved. Inventory is a separate business module, not a quantity field on Menu.
- Preserve the Odoo reference project at `/Users/macbookpro/Documents/personal/restaurant-pos`, including its databases and backups. Migration must be explicit.
- Follow the verification policy below; accurately label unverified behavior.
- No production deployment, live transfers, purchases or vendor messages without authorization.

## Verification policy

Updated by user direction on 2026-10-11; replaces the earlier blanket ban.

- Run the smallest relevant checks for changed code using existing tooling. A scoped typecheck may require project context; do not force ineffective single-file checks.
- Avoid full suites, production builds and repeated checks unless a change, failure or unresolved concern justifies them. Stop once sufficient relevant checks pass; explain any necessary expansion.
- Do not add tests for trivial edits or introduce tooling solely for verification. Add focused tests only when they meaningfully verify changed behavior or important regressions.
- Report checks performed, results and remaining uncertainty. Automated checks do not substitute for required user acceptance or prove production readiness.
- Physical-device checks and production actions require authorization. Database writes/migrations, external services and installation lifecycle scripts are not authorized merely by permission to verify; respect existing scope and sandbox approvals.
