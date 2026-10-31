# Business capability index

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Initial business creation | [BusinessService via public.ts](../public.ts) | Create business, initial branch and binding | Operator bootstrap only; caller supplies active opaque transaction after bootstrap lock; rejects existing business data; staging provisioning/rollback/concurrency verified; no production claim |
| Installation context | [BusinessService via public.ts](../public.ts) | Resolve validated explicit binding; validate bootstrap branch ownership | Optional opaque transaction keeps context resolution in the caller transaction; resolution is not authorization; ownership validates the current bound branch; BA-02 access source enforces staff grants |
| Configuration validation | [validateBusinessConfiguration via public.ts](../public.ts) | Validate reusable names, currency and timezone | Rejects unknown fields; no fiscal defaults, identity hardcoding or connection selection |

See the [module overview](README.md) for boundaries and links to specifications and delivery evidence.

## Billing display source extension — BP-01

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Bound display read/replacement | [DisplaySettingsService via public.ts](../public.ts) | Return current display tuple and revision; replace name/address tuple with retained old/new history | Caller supplies trusted scope/active authorization transaction for replacement; currency/timezone read-only; no nested authorization; offline tests and bounded BP-02 PostgreSQL revision-race/history/rollback evidence; no operational activation |
| Display HTTP composition | [BusinessDisplayHttpModule](../http/business-display-http.module.ts) | Source for GET/PUT `/api/v1/business/display-settings` | Mounted through BillingModule in AppModule; supported shared HTTP validation/envelope; staff read, administrator+CSRF update through existing Access |

Display changes do not alter initial provisioning or accepted Access contracts. Source migration adds revision/history; migration 0006 and bounded BP-02 display persistence checks passed on one disposable target; no operational activation. [Billing handoff](../../billing/docs/features/settlement/phase-tracker.md) owns BP-01/BP-02 evidence and limits.
