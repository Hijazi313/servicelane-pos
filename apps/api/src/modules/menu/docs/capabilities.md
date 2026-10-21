# Menu capability index

Source capabilities have focused offline and bounded PostgreSQL evidence; migration 0003 is applied on the authorized disposable test target. MN-01 was explicitly user-accepted on 2026-10-19 under the recorded backend development limits; [PR #9](https://github.com/Hijazi313/servicelane-pos/pull/9) is merged as `b09770e`.

| Capability | Public entry point | Purpose | Important constraints |
| --- | --- | --- | --- |
| Catalogue maintenance | [MenuController](../http/menu.controller.ts) (`POST/PUT /api/v1/menu/offerings`, deactivate) | Maintain item/size/extra/combo definitions | Administrator + MN-00 session/CSRF; business scoped, per-offering revision; complete definition writes; prospective compact edit envelope must fit 16 KiB after generated IDs/money; schema verified on disposable test target only |
| Active catalogue read | [MenuController](../http/menu.controller.ts) (`GET /offerings`) | List saleable offerings and choices | Authorized current-branch staff/admin; inactive variants/options filtered; one business snapshot |
| Definition inspection | [MenuController](../http/menu.controller.ts) (`GET /definitions`) | Inspect inactive definitions for maintenance | Administrator only |
| Selection pricing | [MenuController](../http/menu.controller.ts) (`POST /resolve`) | Validate selections and calculate exact configured-currency price/composition | Session/CSRF; nonbinding preview, no order or stock writes; Orders uses the supported transactional resolver below, not this HTTP preview |
| Transactional order resolution | [MenuOrderResolver via public.ts](../public.ts) | Structurally normalize selections without catalogue I/O; batch-resolve selected names/composition and exact unit minor amounts from one snapshot | OR-01 consumer extension; semantic MenuError reasons are exported without HTTP status; caller supplies active authorized scope; no nested authorization/transaction, writes or foreign persistence exposure; focused Orders offline and bounded PostgreSQL consumer integration evidence; [limits](../../orders/docs/features/capture/phase-tracker.md#persistence-integration-result--2026-10-21) |

| HTTP error translation | [http/public.ts](../http/public.ts) | Translate semantic Menu error reasons to the existing HTTP statuses | HTTP consumers only; MenuController and Orders filter reuse this mapping; domain/application layers do not import it |

See the [module overview](README.md) for boundaries and links to specifications and delivery evidence.
