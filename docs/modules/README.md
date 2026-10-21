# Module behavior

Actual module specifications live beside their owning code in `apps/api/src/modules/<module>/docs/README.md`, with substantial features under `docs/features/<feature>/`. This global document holds cross-cutting operational guidance only. Use the [spec-driven delivery skill](../../.agents/skills/spec-driven-delivery/SKILL.md) for workflow and templates. BA-01, BA-02 and BA-03 are user-accepted under their recorded development scopes; [joint closeout](../planning/business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) owns evidence, limits and deferred/unrun installation/release checks. Public capabilities are indexed in [Business](../../apps/api/src/modules/business/docs/capabilities.md) and [Authentication](../../apps/api/src/modules/authentication/docs/capabilities.md). [Menu source](../../apps/api/src/modules/menu/docs/README.md) now supplies catalogue maintenance, selectable sizes, optional extras, configurable combos and current selection pricing. MN-00 is user-accepted; MN-01 source/offline checks and the authorized bounded PostgreSQL run/cleanup passed; migration 0003 is applied on the disposable test target, with MN-01 backend development scope explicitly accepted on 2026-10-19 and integrated through PR #9 (`b09770e`).

[Orders capabilities](../../apps/api/src/modules/orders/docs/capabilities.md) cover accepted OR-01 backend development scope, including bounded persistence evidence; [owning tracker](../../apps/api/src/modules/orders/docs/features/capture/phase-tracker.md) retains acceptance and evidence limits. [Kitchen planning](../planning/kitchen/phase-tracker.md) proposes the next handoff; business boundaries are approved; technical review and implementation authorization remain pending. No kitchen/payment/fiscal workflow is delivered.

## Cross-cutting operational requirements

Apply the following only to affected workflows.

- Use decimal-safe money with explicit rounding; preserve sale-time names, prices, options and tax details.
- Use transactions, idempotency and deliberate concurrency handling for orders and payments.
- Keep order, kitchen, payment and print states distinct. Recover missed kitchen changes from durable server state; make failures and uncertain delivery visible.
- Track inventory through auditable movements. Define units, deduction timing, waste and refund behavior before claiming automatic consumption.
- Preserve financial history through explicit corrections/reversals. Treat voids, refunds, discounts and reprints as distinct events.
- Printing acceptance requires the actual Windows/Fujitsu FP-1100 setup. A queued job is not evidence of physical output. Silent printing and bridge permission remain open decisions.
- Plan recovery from the first complete workflow. Keep development, acceptance and production data separate; define backup loss/recovery targets with the owner.
