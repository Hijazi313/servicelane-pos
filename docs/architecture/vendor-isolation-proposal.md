# Vendor isolation and deployment proposal

Status: topology approved by explicit user instruction on 2026-10-12. Detailed operational controls remain proposed where not explicitly decided.
Authority: user approved one-business LAN installation, dedicated local PostgreSQL, locally served client assets and one maintained codebase, then authorized joint Business/Branch and Authentication/Access specifications. Planning only; no implementation, installation, database writes, provisioning or deployment.

## Requirement provenance

The [project scope](../project-scope.md) records multi-business rollout and Business → Branch ownership. LAN operation without internet comes from the existing [architecture direction](README.md#stack-and-composition) and the supplied foundation handoff; it is the evaluation constraint used here, not a newly approved deployment decision. The user explicitly approved a local installation/database per business on 2026-10-12; this resolves the topology choice. Hardware, operational ownership and recovery targets remain open. Current status and authorization are owned by [project scope](../project-scope.md) and the [joint access tracker](../planning/business-access/phase-tracker.md).

## Approved topology

Use one restaurant-LAN installation per independent business for the initial rollout: local API, locally served client assets and a dedicated local PostgreSQL database. Devices use that API over the LAN. Each installation runs the same maintained codebase with separate business configuration and credentials. Chickano is the first configured business, not a code variant.

This is the simplest proposed fit for the documented LAN operation without internet. A cloud API or cloud database on the operational request path would make that requirement fail during an internet outage. The existing hosted database remains a development arrangement, separate from the approved local production topology. No provider, hardware, operating system or packaging tool is selected here.

## Alternatives

| Model | Internet loss while LAN/server remain available | Isolation | Support, recovery and rollout |
| --- | --- | --- | --- |
| Local API and dedicated local database per business — recommended | Local trading can continue if assets, login and required runtime services are also local | Separate database, credentials and installation; access controls still required | Maintain each site's host, backups and version; restore one business independently; repeat the same release procedure across sites |
| Shared hosted API with dedicated database per business | Trading stops without another local execution path | Database separation reduces accidental data mixing; application routing, secrets and support access remain business-sensitive | Central app updates; separate database migrations/backups/restores; remote host and internet dependency |
| Shared hosted API and shared database | Same internet dependency | Every request, query, job, report and restore needs a coherent tenant boundary; tenant IDs alone are insufficient | Central updates; selective business restore and shared failure impact add complexity |

A local-plus-cloud synchronized model could address later remote access needs, but introduces conflict resolution, duplicate delivery and recovery rules. It is deferred; it is not needed to choose the first LAN topology. Dedicated cloud hosting per business also retains the internet dependency.

## Proposed boundary and behavior

- A business is the vendor boundary. Provision one explicit Business and one operational Branch initially, without a permanent one-branch constraint or implicit first-branch selection. Business/Branch and Authentication/Access specifications will define the exact schema and mechanisms after the topology decision.
- One installation serves one business. Server configuration establishes the installation's business boundary; an arbitrary client business identifier must never select another vendor's database or bypass authorization. Staff identity, permitted branch and action permissions remain server-enforced.
- Keep operational data, configuration, secrets, reports, backup destinations and restore targets separate per business. A dedicated database is not sufficient if support tooling, files or backups mix businesses. Support access must be controlled and attributable; LAN access alone is not staff authentication.
- Local login and ordinary POS actions must have no mandatory cloud identity, asset, licensing or database dependency. Losing internet is different from losing the LAN or local server: disconnected-device writes are unresolved and are not promised. Server/power failure interrupts service until recovery; automatic failover is not proposed.
- Run reviewed releases and explicit migrations per installation, recording the version and outcome. Back up before risky changes and define recovery for both application and data changes; an application downgrade does not undo a migration. Avoid customer forks and manual database edits.
- Define scheduled protected backups and a recoverable copy outside the local host; remote upload may wait for internet. Restore must validate the selected business, credentials and compatible application version. Backup frequency and tolerated data loss/downtime require agreement before deployment.
- Later branches in different cities cannot rely on one restaurant LAN. Central hosting versus branch-local persistence and synchronization needs a separate decision before multi-branch operation. Explicit branch identity now preserves ownership, not automatic synchronization.

## Minimum decision and later scope

Topology review is complete. The alternatives above remain the decision rationale; detailed control proposals below the approved topology are not implementation authorization. Joint specifications are the next planning deliverable.

For the first deployment, local operation, server-enforced access, separate business recovery and repeatable updates are proposed product/release essentials: their absence would respectively stop trading on internet loss, permit unauthorized use, risk cross-business recovery or make rollout unreliable. Exact controls and observable scenarios belong in the affected approved specifications.

P1/deferred: SaaS control plane, vendor billing, public signup, remote dashboards, automatic fleet updates and high availability. They can wait without invalidating the proposed first-site model. Multiple-branch operation and cloud synchronization remain future requirements outside this increment; fiscal integrations cannot be classified as optional before applicability is established.

## Review decisions

1. Resolved by user approval on 2026-10-12: one-business LAN installation, local API/database and client assets, one maintained codebase. Shared hosting is not the selected initial topology.
2. Confirm who supplies and maintains the always-available local host, LAN and power protection, and who may provision, support, update and restore a business. These are operational responsibilities, not a reason to pick hardware now.
3. Agree acceptable downtime/data loss and backup custody before deployment planning. No availability or recovery guarantee is established by this proposal.

Topology approval authorizes the [joint specification planning](../planning/business-access/phase-tracker.md) only: specify Business/Branch and Authentication/Access together. Implementation needs separate phase authorization. Operational details may remain open during specification where they do not affect its contracts; they must be resolved before deployment.

## Future acceptance and evidence limits

Once separately authorized, demonstrate two independently configured businesses from the same release; reject foreign business/branch access; keep reports, jobs and backups within their boundary; restore one business without changing the other. On a representative LAN installation, remove internet and verify local asset loading, staff login and the then-implemented trading flow. Verify server restart/recovery and repeatable release/migration procedures before rollout. These are proposed outcomes, not executed checks or a new foundation gate.

The foundation remains accepted under its revised scope. Deferred migration, toolchain, TLS and operational checks remain in the [canonical handoff](../planning/project-foundation/phase-tracker.md#current-handoff--2026-10-12) and [acceptance record](../acceptance/project-foundation.md#deferred-checks-and-limits). The local production topology needs its own validation; hosted development health does not prove it.

This proposal makes no legal-compliance claim. Apply the [compliance policy](../compliance/README.md) when billing, payments, personal-data handling and retention are specified. Any confirmed mandatory online fiscal interaction must be reconciled with offline trading before that workflow's release; no offline exemption is assumed.

References: [scope](../project-scope.md), [rollout guidance](README.md#multiple-restaurant-rollout), [decision rules](../decision-making.md).
