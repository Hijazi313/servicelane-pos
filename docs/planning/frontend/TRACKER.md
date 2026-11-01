# Frontend overview

Last reconciled: 2026-11-01, against the linked records in this checkout. Other chats and worktrees are not verified; assignments there are unconfirmed.

| Work | Status and material limits | Owning detail |
| --- | --- | --- |
| Access | Active; login form reported visible, but successful authentication, cookies, logout and browser routing remain unverified. | [Access phase tracker](../frontend-access/phase-tracker.md) |
| Foundation | Awaiting acceptance; browser rendering and release are not established by its recorded checks. | [Web setup](../../../apps/web/README.md) / [recorded foundation evidence](../tracker-history-2026-11-01.md#current-focus) |
| Design and theme | Visual direction accepted in general; design decisions and representative browser/device verification remain pending. | [Design baseline](../../design/frontend-design-baseline.md) / [web setup](../../../apps/web/README.md) |

## Proposed workflow roadmap

This is a suggested sequence for discussion, not approved scope or permission to implement. Frontend workflows may combine backend capabilities; each needs discovery, agreed behavior and verified contract availability before implementation. Adjacent work can proceed in parallel when its dependencies are clear.

| Order | Workflow | Proposed outcome / dependency |
| --- | --- | --- |
| 1 | Access and application foundation | Complete the active [access flow](../frontend-access/phase-tracker.md) and resolve foundation/design decisions needed for the first workflow. Browser and session evidence remain pending. |
| 2 | Cashier: menu selection and order capture | Establish a representative cashier journey using the available [Menu](../../../apps/api/src/modules/menu/docs/README.md) and [Orders](../../../apps/api/src/modules/orders/docs/README.md) capabilities; confirm ordering behavior and API availability first. |
| 3 | Kitchen preparation | Scope staff access to preparation queues and status changes using the [Kitchen plan](../../../apps/api/src/modules/kitchen/docs/README.md); coordinate the order-to-kitchen journey. |
| 4 | Cashier shifts, billing and payment | Scope the smallest shift and settlement workflow against [Cashier Shifts](../../../apps/api/src/modules/cashier-shifts/docs/README.md) and [Billing](../../../apps/api/src/modules/billing/docs/README.md); payment, receipt and recovery decisions need their own approval and evidence. |
| 5 | Menu management | Scope administrative catalogue workflows using the [Menu plan](../../../apps/api/src/modules/menu/docs/README.md); define permissions and configuration before implementation. |
| 6 | Inventory | Follow [Inventory discovery](../inventory/discovery.md); frontend behavior depends on agreed stock workflows and available contracts. |
| 7 | Reports | Proposed; identify audiences, reporting needs and available data before defining screens or contracts. |

The order is a planning recommendation, not a claim that any complete trading flow is already supported. Printing, reconnect and operational recovery require separate integration evidence.

Branch and checkout information is recorded in [active work branches](../TRACKER.md#active-work-branches); verify it before relying on it. This overview does not authorize work or replace feature evidence.
