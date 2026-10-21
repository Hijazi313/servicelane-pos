# Business capability index

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Initial business creation | [BusinessService via public.ts](../public.ts) | Create business, initial branch and binding | Operator bootstrap only; caller supplies active opaque transaction after bootstrap lock; rejects existing business data; staging provisioning/rollback/concurrency verified; no production claim |
| Installation context | [BusinessService via public.ts](../public.ts) | Resolve validated explicit binding; validate bootstrap branch ownership | Optional opaque transaction keeps context resolution in the caller transaction; resolution is not authorization; ownership validates the current bound branch; BA-02 access source enforces staff grants |
| Configuration validation | [validateBusinessConfiguration via public.ts](../public.ts) | Validate reusable names, currency and timezone | Rejects unknown fields; no fiscal defaults, identity hardcoding or connection selection |

See the [module overview](README.md) for boundaries and links to specifications and delivery evidence.
