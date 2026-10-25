# Billing and Payments — proposed module plan

Status: proposed; planning delivered, implementation inactive. Owner: primary agent.

## Outcome and boundaries

Recommend **BP-01: settle one captured takeaway order in full with cash and read back its immutable bill/payment record**. This is a bounded backend development increment, not a complete trading flow or restaurant release. A payable bill is meaningful only after explicit approval of the fiscal policy; Orders' merchandise total is not silently promoted to payable.

Billing owns bill-time monetary/fiscal snapshots, settlement identity and cash-payment attribution. Orders retains captured merchandise history; Kitchen retains preparation only. Reuse existing Business configuration and Authentication authorization. No provider integration, new permission framework, accounting engine or cashier-shift dependency is justified for this technical slice.

Public capabilities: none implemented. No Billing module exists; keep discovery here rather than scaffold application directories for documentation. At authorized source entry, move this plan/specification/tracker/decisions into the owning module's existing `docs/` pattern, leave transition links here and add its capability index. Module naming/placement is a routine implementation choice within the approved ownership boundary.

## Scope and phases

The [specification](spec.md) defines phase P0 and observable acceptance. The [decisions](decisions.md) record owner-approved development recommendations and the remaining fiscal-policy/mode decision. The [phase tracker](phase-tracker.md) owns authorization, evidence and handoff.

| Phase | Outcome | Status / exit |
| --- | --- | --- |
| BP-00 | Agree smallest scope, money/fiscal/receipt/correction decisions and complete concrete contracts | Proposed; fiscal mode and contract review resolved before source entry |
| BP-01 | Implement approved full-cash settlement/readback, narrow Orders projection and migration source | Proposed; focused offline evidence against BP-A01–07, reviewed source; no database permission inherited |
| BP-02 | Prove atomic persistence, duplicate handling and fresh-process readback on a reserved disposable target | Proposed objective only; separately approved prepared procedure, one bounded run and owned cleanup; user development acceptance separate |

No phase is activated by this table. Operational corrections/refunds, fiscal output, collection/completion and complete trading-flow/recovery acceptance remain release prerequisites needing their own scope, not automatic BP-02 work.

## P1 for this increment

- Card/provider integration, external-terminal recording, mobile wallets, split/partial/mixed tenders and credit: cash alone can demonstrate one settlement; external outcomes add uncertainty/reconciliation contracts.
- Discounts, tips, service charges, bill splitting/merging and promotions: no accepted requirement for this slice; each changes payable semantics.
- Bill/payment search, reports, shift reconciliation, cash drawer control, accounting export and generic ledgers: known order ID and one detail read suffice for development proof. Shifts remain a later module.
- Browser checkout, receipt layout/printing/bridge, reprints and live updates: backend readback is sufficient here; actual physical output requires its own acceptance.

These are phase P1, not declarations that they are unnecessary for the product. Mandatory applicable fiscal behavior and essential corrections cannot be deferred from affected operational release merely by calling them P1.
