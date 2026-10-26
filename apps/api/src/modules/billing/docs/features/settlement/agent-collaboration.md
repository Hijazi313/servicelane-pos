# BP-00 contract reviews

Specification: [spec](spec.md). Authorization/results: [phase tracker](phase-tracker.md). Coordinator: primary agent.

| Assignment | Owner | Allowed responsibility |
| --- | --- | --- |
| Settings/defaults and Business boundaries | `settings_review` | Independent read-only source/document review; recommendations only |
| Assessment/settlement/readback/admin HTTP | `http_review` | Independent read-only source/wiring/contract review; recommendations only |
| Money/retries/concurrency/acceptance | `integrity_review` | Independent read-only source/document review; recommendations only |
| Documentation reconciliation and checkpoints | Primary agent | All Billing documentation, global tracker, branch/index/local commits |

Shared checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, branch `codex/billing-planning`, entry `e936bdc`, integration base `d75ac92`. Agents cannot edit files or mutate Git. No runtime resources allocated; no tests/builds/environment/database access, installation or publication. Primary reconciles returned findings into the existing specification, then reviews the combined documentation diff. No source, migration, manifest, skill or guardrail edits; no accepted Orders/Kitchen revalidation. Ownership ledgers and existing incident reviews remain untouched.

Bounded revision continuation: the same three reviewers supplied read-only multiple-rule recommendations after the owner authorized the BP-00 scope change. Settings covers rule/default/selection constraints; HTTP covers unchanged seven routes plus selection/replay/capacity; integrity covers included/exclusive allocation and reconciliation. Primary remains sole documentation/Git owner; no source/runtime/database work.

## BP-01 source assignments

Shared checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`; branch `codex/billing-planning`; checkpoint `248ddad`, integration base `d75ac92`. Integrate by primary review in this checkout; agents never stage/commit/switch branches or touch environments/databases. Accepted spec is shared contract authority. All source is isolated from AppModule activation.

- Money agent exclusively owns `billing/domain/` and `tests/billing-money.test.mjs`: policy types/normalizers, errors, exact calculation and capacity rules. Export agreed types/functions from `domain/billing.ts`; consume Orders public OrderFinancial and Business public DisplayView types with type-only imports.
- Interface agent exclusively owns new Orders financial service and Business display domain/application/infrastructure/http files, Business schema additions, and new `tests/billing-interfaces.test.mjs`. May edit Orders/Business public.ts/module exports and capability indexes. Business HTTP module remains unmounted; no Authentication dependency cycle. Provide OrderFinancialService.get(scope,id), DisplaySettingsService.get(scope), DisplaySettingsService.replace(scope,input), DisplaySettingsService.read(proof)/update(proof,input) through separate Access-dependent HTTP/application composition if needed. Primary owns SQL migration.
- Application agent exclusively owns `billing/application/`, `billing/http/`, and `tests/billing.test.mjs`, `tests/billing-http.test.mjs`. Coordinate domain contract with money agent before coding. Define BillingStore port; primary implements adapter. No module wiring/schema/migration/Git ownership.
- Primary exclusively owns Billing composition/public exports, Billing persistence/schema, shared schema entrypoint, migration source/journal, package script, documentation relocation/indexes/global tracker, Git and integration review. Does not edit agent-owned source until handoff.

All agents read applicable instructions/spec and report executed checks and limits. No accepted upstream suites, no installation, environment/database access or migration execution.

### BP-01 handoff reconciliation

All three bounded source assignments handed off to primary before integration edits. Application assignment also added `tests/billing-fixture.mjs`. Primary reviewed integrated diffs, relocated canonical docs, added SQL/metadata/isolation and seven-route HTTP coverage, corrected known-unavailable classification and corrupt source checks, moved Business access coordination service into `application/`, and exposed its isolated HTTP module via `http/public.ts`. Money agent performed a final read-only integrity review; two concrete findings were corrected with focused regressions. All Git/index, composition, migration generation and final checks remained primary-owned. No agent used environments/databases, installation, publication or upstream accepted suites.
