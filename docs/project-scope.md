# Project scope and working policy

- Build a reusable restaurant POS product intended for rollout to multiple independent restaurant businesses/vendors. Chickano in Faisalabad is the first deployment, not a permanent product limitation.
- The first deployment uses PKR and Asia/Karachi. Restaurant identity, branding, currency, timezone and applicable fiscal settings must come from validated business configuration rather than hardcoded Chickano assumptions. Configurable currency does not imply multi-currency transactions are in MVP scope.
- Support rollout through the same maintained codebase; avoid per-restaurant forks. Shared hosted multi-tenancy versus isolated installations remains an open deployment decision.
- Establish Business → Branch ownership from the beginning. MVP operation provisions one branch per business; support for operating multiple branches is a confirmed future requirement, including branches in the same or different cities. Branch management, switching, transfers, consolidated reports and synchronization are deferred.
- Current work is discovery and architecture documentation. Do not scaffold or implement application code until the user authorizes development.
- Backend first: establish the project foundation before business modules. Business/Branch foundation and Authentication/Access then form the first integrated business milestone, followed by Menu. Authentication and server-enforced authorization are MVP P0. Detailed implementation phases remain to be defined and approved. Inventory is a separate business module, not a quantity field on Menu.
- Preserve the Odoo reference project at `/Users/macbookpro/Documents/personal/restaurant-pos`, including its databases and backups. Migration must be explicit.
- Do not run tests, builds, lints, runtime acceptance or device checks unless the user changes the existing verification policy. Prepare user-run acceptance instructions and accurately label unverified behavior.
- No production deployment, live transfers, purchases or vendor messages without authorization.
