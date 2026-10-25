# Kitchen

Owns preparation tickets, dispatch identity, branch queue ordering and whole-ticket preparation state. Orders owns immutable capture history and the supported transactional preparation projection; Authentication owns trusted session/actor/branch authorization. No direct foreign persistence access or current Menu resolution.

- [Specification and HTTP contract](features/preparation/spec.md)
- [Decisions](features/preparation/decisions.md)
- [Phase tracker, authorization and evidence limits](features/preparation/phase-tracker.md)
- [Capabilities and dated REST API adoption baseline](capabilities.md#rest-api-adoption)

KT-01 source is delivered and KT-02 bounded technical verification is complete; the recorded backend development scope was explicitly user-accepted on 2026-10-25; operational release remains separate. Migration 0005 is applied; K01–K04 evidence and final D01 passed, with sixteen empty tables and intact history after owned cleanup. No KDS UI, printing, billing/payment gate, amendments/cancellation, collection/completion, branch configuration or operational release is provided. Those remain separate scope.

All four Kitchen HTTP routes adopted REST API skill v0.4.0 on **2026-10-25**. The capability index records the exact convention/skill baseline, contract changes, verification and shared adapter limits for future agents.
