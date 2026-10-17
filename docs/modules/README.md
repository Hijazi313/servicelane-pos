# Module behavior

Actual module specifications live beside their owning code in `apps/api/src/modules/<module>/docs/README.md`, with substantial features under `docs/features/<feature>/`. This global document holds cross-cutting operational guidance only. Use the [spec-driven delivery skill](../../.agents/skills/spec-driven-delivery/SKILL.md) for workflow and templates. BA-01, BA-02 and BA-03 are user-accepted under their recorded development scopes; [joint closeout](../planning/business-access/phase-tracker.md#ba-03-acceptance-and-closeout--2026-10-17) owns evidence, limits and deferred/unrun installation/release checks. Public capabilities are indexed in [Business](../../apps/api/src/modules/business/docs/README.md) and [Authentication](../../apps/api/src/modules/authentication/docs/README.md). Menu remains unimplemented; next-module planning is deferred to a new chat.

## Cross-cutting operational requirements

Apply the following only to affected workflows.

- Use decimal-safe money with explicit rounding; preserve sale-time names, prices, options and tax details.
- Use transactions, idempotency and deliberate concurrency handling for orders and payments.
- Keep order, kitchen, payment and print states distinct. Recover missed kitchen changes from durable server state; make failures and uncertain delivery visible.
- Track inventory through auditable movements. Define units, deduction timing, waste and refund behavior before claiming automatic consumption.
- Preserve financial history through explicit corrections/reversals. Treat voids, refunds, discounts and reprints as distinct events.
- Printing acceptance requires the actual Windows/Fujitsu FP-1100 setup. A queued job is not evidence of physical output. Silent printing and bridge permission remain open decisions.
- Plan recovery from the first complete workflow. Keep development, acceptance and production data separate; define backup loss/recovery targets with the owner.
