# BP-00 contract reviews

Specification: [spec](spec.md). Authorization/results: [phase tracker](phase-tracker.md). Coordinator: primary agent.

| Assignment | Owner | Allowed responsibility |
| --- | --- | --- |
| Settings/defaults and Business boundaries | `settings_review` | Independent read-only source/document review; recommendations only |
| Assessment/settlement/readback/admin HTTP | `http_review` | Independent read-only source/wiring/contract review; recommendations only |
| Money/retries/concurrency/acceptance | `integrity_review` | Independent read-only source/document review; recommendations only |
| Documentation reconciliation and checkpoints | Primary agent | All Billing documentation, global tracker, branch/index/local commits |

Shared checkout: `/Users/macbookpro/Documents/personal/restaurant-pos-custom`, branch `codex/billing-planning`, entry `e936bdc`, integration base `d75ac92`. Agents cannot edit files or mutate Git. No runtime resources allocated; no tests/builds/environment/database access, installation or publication. Primary reconciles returned findings into the existing specification, then reviews the combined documentation diff. No source, migration, manifest, skill or guardrail edits; no accepted Orders/Kitchen revalidation. Ownership ledgers and existing incident reviews remain untouched.
