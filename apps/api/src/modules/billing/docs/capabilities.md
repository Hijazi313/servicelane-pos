# Billing capability index

BP-01 isolated source/offline implementation only. `BillingModule` is deliberately absent from AppModule; no live settlement activation or installed sample policy. [Evidence and limits](features/settlement/phase-tracker.md#bp-01-delivery-evidence--2026-10-26).

| Capability | Public entry point | Purpose | Constraints |
| --- | --- | --- | --- |
| Billing source composition | [BillingModule via public.ts](../public.ts) | Compose seven new routes through supported Orders/Business/Access providers | Explicit source composition only; no startup activation; shared AccessHttpModule remains the host HTTP boundary |
| Calculation policy | [BillingController](../http/billing.controller.ts) GET/PUT `/api/v1/billing/policy` | Staff read; administrator revision-checked complete replacement with owned history | Up to eight taxes/eight charges; no sample defaults; retired IDs retained; currency/scale bound to Business |
| Payable assessment | [BillingController](../http/billing.controller.ts) POST `/api/v1/billing/assessments` | Exact selected-charge/tax breakdown in one authorized transaction | No persisted draft; policy required; snapshot/capacity checks; no physical/fiscal proof |
| Full cash settlement/readback | [BillingController](../http/billing.controller.ts) POST `/api/v1/billing/bills`, GET `/api/v1/billing/orders/:orderId/bill` | Immutable singular payment with scoped retry identity and saved readback | Positive full payable only; current authorization on replay; no Orders/Kitchen writes; real persistence evidence absent |
| Business display source composition | [Business HTTP public interface](../../business/http/public.ts) | Staff read/admin edit name/address through two Business-owned routes | Currency/timezone read-only; separate unmounted module; Business retains tuple/history |

No bill mutation/refund/delete/listing/fiscal output, payment provider, legal-entity model or operational readiness is implied.
