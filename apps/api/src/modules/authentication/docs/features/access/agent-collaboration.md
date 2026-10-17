# BA-02 source assignment — 2026-10-12 (historical)

Current status: BA-02 complete under [user acceptance dated 2026-10-17](../../../../../../../../docs/planning/business-access/phase-tracker.md#ba-02-acceptance--2026-10-17); no active agent assignment. Earlier restrictions below describe the historical source assignment.

Authorized scope and acceptance limits: [joint tracker](../../../../../../../../docs/planning/business-access/phase-tracker.md#ba-02-authorization--2026-10-12). Shared current checkout, existing HEAD; no branches/worktrees/index operations. Primary agent integrates all changes sequentially in this checkout. Parallel work is permitted by spec-driven-delivery workflow; no user-facing chats.

| Owner | Non-overlapping files / outcome |
| --- | --- |
| Primary | Application contracts/use cases, HTTP/Nest composition, configuration, operator recovery, docs, migration composition/generation and integration checks |
| credentials agent | Private hash adapter, bootstrap application/persistence separation, credential and application-policy tests; final read-only review; preserve public bootstrap signature |
| persistence agent | Authentication access-store adapter/access schema and HTTP injection tests; follows primary-owned contracts |

Shared-file owner: primary owns module/public exports, manifests/lockfiles (no installs), migration files and contracts. Agents report required wiring rather than edit shared files. Source tests only, no database/network/service calls. Primary reviews resulting diff and runs focused integrated checks; agent confidence is not acceptance evidence. Bootstrap must preserve its single transaction and Business public dependency. No concurrent editing of the same file; notify primary of required contract changes.

Integration: primary owns all module wiring, offline migration generation/review, recovery-boundary tests, final checks and documentation reconciliation. Agents made no database calls or dependency changes. Their focused checks do not substitute for the primary combined verification or required runtime acceptance.

Final source checks: primary combined BA-02 compile/23 tests passed; 12 BA-01 regressions passed. Database, trusted browser, target-host and release acceptance remain pending. All source assignments are complete; no agent has authorization to execute acceptance or activate BA-03.
