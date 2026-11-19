# Frontend overview

Last reconciled: 2026-11-20, against the linked records in this checkout. Other chats and worktrees are not verified; assignments there are unconfirmed.

| Work | Status and material limits | Owning detail |
| --- | --- | --- |
| Access | Active, pending user acceptance. The user reports local HTTPS login, logout, re-login and hard refresh. Cookie attributes and signed-out routing remain open. | [Access phase tracker](../frontend-access/phase-tracker.md) |
| Foundation | Complete. On 2026-11-20 the user accepted the basic React, TypeScript and Vite workspace, visible entry point and dev/build commands. The recorded strict typecheck, build and local HTTP page response cover this increment. Access acceptance, representative device rendering and production release are separate. | [Web setup](../../../apps/web/README.md) / [recorded foundation evidence](../tracker-history-2026-11-01.md#current-focus) |
| Design and theme | Visual direction accepted in general; design decisions and representative browser/device verification remain pending. | [Design baseline](../../design/frontend-design-baseline.md) / [web setup](../../../apps/web/README.md) |

## Proposed workflow roadmap

This sequence starts with the prerequisites for a fresh installation and follows the staff workflow. It is a planning recommendation; each workflow needs discovery, agreed behavior and verified contract availability before implementation. Independent work can proceed in parallel where dependencies permit.

| Order | Workflow | Proposed outcome / dependency |
| --- | --- | --- |
| 1 | Access and application foundation | The basic foundation is complete. Resolve the remaining [access checks and acceptance](../frontend-access/phase-tracker.md); administrator access is needed for catalogue maintenance. |
| 2 | Initial menu setup | Review the [initial menu setup proposal](initial-menu-setup.md). The owner needs sizes, add-ons and meal deals. The photo control is disabled and labelled coming soon. File storage and upload are deferred. Inspection scope and the access gate await decisions. |
| 3 | Cashier: menu selection and order capture | Scope a cashier journey using the configured catalogue and [Orders capabilities](../../../apps/api/src/modules/orders/docs/capabilities.md). Confirm selection behavior and API availability. |
| 4 | Kitchen preparation | Scope staff access to preparation queues and status changes using the [Kitchen plan](../../../apps/api/src/modules/kitchen/docs/README.md); coordinate the captured order-to-kitchen journey. |
| 5 | Cashier shifts, billing and payment | Scope the smallest shift and settlement workflow against [Cashier Shifts](../../../apps/api/src/modules/cashier-shifts/docs/README.md) and [Billing](../../../apps/api/src/modules/billing/docs/README.md); payment, receipt and recovery decisions need their own approval and evidence. |
| 6 | Inventory | Follow [Inventory discovery](../inventory/discovery.md); frontend behavior depends on agreed stock workflows and available contracts. |
| 7 | Reports | Identify audiences, reporting needs and available data before defining screens or contracts. |

The later order is provisional and must be checked against actual operational dependencies during scoping. Menu maintenance beyond the initial catalogue belongs in its own agreed scope. A complete trading flow, printing, reconnect and operational recovery require separate integration evidence.

Branch and checkout information is recorded in [active work branches](../TRACKER.md#active-work-branches); verify it before relying on it. This overview does not authorize work or replace feature evidence.
