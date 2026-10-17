# Business

Owner: primary agent. Delivery: BA-01 accepted on staging in the [joint tracker](../../../../../../docs/planning/business-access/phase-tracker.md).

Owns Business, Branch and the explicit singleton installation binding. Initial operator provisioning creates one branch; there is no permanent one-branch schema constraint. No business HTTP controller or configuration editor is exposed. Intended rules and P0/P1 scope: [Business/Branch specification](features/foundation/spec.md).

## Public capabilities

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Initial business creation | [BusinessService via public.ts](../public.ts) | Create business, initial branch and binding | Operator bootstrap only; caller supplies active opaque transaction after bootstrap lock; rejects existing business data; staging provisioning/rollback/concurrency verified; no production claim |
| Installation context | [BusinessService via public.ts](../public.ts) | Resolve validated explicit binding; validate bootstrap branch ownership | Optional opaque transaction keeps context resolution in the caller transaction; resolution is not authorization; ownership validates the current bound branch; BA-02 access source enforces staff grants |
| Configuration validation | [validateBusinessConfiguration via public.ts](../public.ts) | Validate reusable names, currency and timezone | Rejects unknown fields; no fiscal defaults, identity hardcoding or connection selection |

Authentication references Business through this public interface; the shared schema entry point exists only for migration generation. Context resolution does not authenticate staff; consumers must add server-enforced access before any HTTP exposure. Joint provisioning owns transaction coordination outside either module. [Authorization/evidence](../../../../../../docs/planning/business-access/phase-tracker.md#ba-01-authorization--2026-10-12) owns progress and one next action; this index does not duplicate a tracker.
