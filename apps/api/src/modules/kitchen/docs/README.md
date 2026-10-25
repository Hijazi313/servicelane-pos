# Kitchen

Owns preparation tickets, dispatch identity, branch queue ordering and whole-ticket preparation state. Orders owns immutable capture history and the supported transactional preparation projection; Authentication owns trusted session/actor/branch authorization. No direct foreign persistence access or current Menu resolution.

- [Specification and HTTP contract](features/preparation/spec.md)
- [Decisions](features/preparation/decisions.md)
- [Phase tracker, authorization and evidence limits](features/preparation/phase-tracker.md)
- [Capabilities and dated REST API adoption baseline](capabilities.md#rest-api-adoption)

KT-01 is source/offline delivered, pending review/acceptance. Migration 0005 is applied; the post-0005 KT-02 run passed K01–K04, failed fresh-process verification (D01 unverified) and passed owned cleanup. No KDS UI, printing, billing/payment gate, amendments/cancellation, collection/completion, branch configuration or operational release is provided. Those remain separate scope.

All four Kitchen HTTP routes adopted REST API skill v0.4.0 on **2026-10-25**. The capability index records the exact convention/skill baseline, contract changes, verification and shared adapter limits for future agents.
