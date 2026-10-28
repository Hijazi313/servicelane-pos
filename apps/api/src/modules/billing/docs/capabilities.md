# Billing capability index

BP-01 isolated implementation plus BP-02 bounded PostgreSQL verification; user-accepted/closed on 2026-10-27 under the recorded scope and limitations. `BillingModule` is deliberately absent from AppModule; no live settlement activation or installed sample policy. [Evidence and limits](features/settlement/phase-tracker.md#bp-01-delivery-evidence--2026-10-26).

| Capability | Public entry point | Purpose | Constraints |
| --- | --- | --- | --- |
| Billing source composition | [BillingModule via public.ts](../public.ts) | Compose seven new routes through supported Orders/Business/Access providers | Explicit source composition only; no startup activation; shared AccessHttpModule remains the host HTTP boundary |
| Calculation policy | [BillingController](../http/billing.controller.ts) GET/PUT `/api/v1/billing/policy` | Staff read; administrator revision-checked complete replacement with owned history | Up to eight taxes/eight charges; no sample defaults; retired IDs retained; currency/scale bound to Business |
| Payable assessment | [BillingController](../http/billing.controller.ts) POST `/api/v1/billing/assessments` | Exact selected-charge/tax breakdown in one authorized transaction | No persisted draft; policy required; snapshot/capacity checks; no physical/fiscal proof |
| Full cash settlement/readback | [BillingController](../http/billing.controller.ts) POST `/api/v1/billing/bills`, GET `/api/v1/billing/orders/:orderId/bill` | Immutable singular payment with scoped retry identity and saved readback | CS-01 source migration requires an intended open cashier session for new cash settlements and invokes Shifts in the same authorized transaction; legacy successful retries remain recoverable. The updated integration is not database-verified or activated. Positive full payable only; current authorization on replay; no Orders/Kitchen writes; prior B01–B07 evidence predates this migration. |
| Business display source composition | [Business HTTP public interface](../../business/http/public.ts) | Staff read/admin edit name/address through two Business-owned routes | Currency/timezone read-only; separate unmounted module; Business retains tuple/history |

No bill mutation/refund/delete/listing/fiscal output, payment provider, legal-entity model or operational readiness is implied.

BP-02 migration 0006, all seven focused database cases and owned cleanup passed on the authorized disposable target; twenty tables empty and seven history entries retained. [Result and limits](features/settlement/phase-tracker.md#bp-02-single-target-execution-result--2026-10-26). No route activation, upstream rerun or restaurant-readiness claim.

[BP-01/BP-02 acceptance](features/settlement/phase-tracker.md#bp-01bp-02-user-acceptance-and-closeout--2026-10-27) does not activate routes or authorize publication, deployment or restaurant use.
