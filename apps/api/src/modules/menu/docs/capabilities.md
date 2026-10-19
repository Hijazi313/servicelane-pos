# Menu capability index

Source capabilities have focused offline and bounded PostgreSQL evidence; migration 0003 is applied on the authorized disposable test target. MN-01 was explicitly user-accepted on 2026-10-19 under the recorded backend development limits; [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9) is merged as `b09770e`.

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Catalogue maintenance | [MenuController](../http/menu.controller.ts) (`POST/PUT /api/v1/menu/offerings`, deactivate) | Maintain item/size/extra/combo definitions | Administrator + MN-00 session/CSRF; business scoped, per-offering revision; complete definition writes; prospective compact edit envelope must fit 16 KiB after generated IDs/money; schema verified on disposable test target only |
| Active catalogue read | [MenuController](../http/menu.controller.ts) (`GET /offerings`) | List saleable offerings and choices | Authorized current-branch staff/admin; inactive variants/options filtered; one business snapshot |
| Definition inspection | [MenuController](../http/menu.controller.ts) (`GET /definitions`) | Inspect inactive definitions for maintenance | Administrator only |
| Selection pricing | [MenuController](../http/menu.controller.ts) (`POST /resolve`) | Validate selections and calculate exact configured-currency price/composition | Session/CSRF; nonbinding preview, no order or stock writes; no supported cross-module service contract until Orders discovery |

See the [module overview](README.md) for boundaries and links to specifications and delivery evidence.
