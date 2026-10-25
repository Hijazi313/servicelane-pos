# Kitchen

Owns preparation tickets, dispatch identity, branch queue ordering and whole-ticket preparation state. Orders owns immutable capture history and the supported transactional preparation projection; Authentication owns trusted session/actor/branch authorization. No direct foreign persistence access or current Menu resolution.

- [Specification and HTTP contract](features/preparation/spec.md)
- [Decisions](features/preparation/decisions.md)
- [Phase tracker, authorization and evidence limits](features/preparation/phase-tracker.md)
- [Capabilities](capabilities.md)

KT-01 is source/offline delivered, pending review/acceptance. Migration 0005 is applied; the KT-02 run stopped at K01 and owned cleanup passed. No KDS UI, printing, billing/payment gate, amendments/cancellation, collection/completion, branch configuration or operational release is provided. Those remain separate scope.
