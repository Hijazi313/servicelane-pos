# Global phase tracker

Last reconciled: 2026-11-01 against the linked records in this checkout. Other chats and unmerged worktrees are unconfirmed; reconcile them before relying on their status.

## Current priorities and integration

- **Frontend (2026-11-21):** initial Menu is accepted and closed under the [recorded walkthrough scope](frontend/initial-menu-setup.md#acceptance-and-closeout--2026-11-21); source was merged through [PR #29](https://github.com/Hijazi313/servicelane-pos/pull/29). [Performance](../../KNOWN-ISSUES.md#ki-01--slow-authenticated-workflows-on-the-development-database) and broader access acceptance remain open.
- **Frontend foundation (2026-11-20):** the user accepted the [basic foundation](frontend/TRACKER.md). Access remains active after user-reported local login, logout, re-login and hard refresh. The [access handoff](frontend-access/phase-tracker.md#current-handoff--2026-11-20) owns the remaining checks and acceptance decision.
- **Inventory:** [discovery](inventory/discovery.md) is proposed; implementation is not activated.
- **Integration and release:** the [business/access tracker](business-access/phase-tracker.md) owns accepted scope and deferred two-installation validation. A complete trading flow, including amendments, reconnect and receipt output, remains to be accepted; before MVP release, reconcile menu, payments, shifts, stock and reports and verify recovery and repeatable isolated provisioning.

## Application overviews

- [Frontend](frontend/TRACKER.md): client work and its owning records.
- [Backend](backend/TRACKER.md): backend work and its owning records.

Feature trackers own progress, evidence, authorization and handoffs. The coordinator reconciles affected summaries at meaningful checkpoints; an overview is not live cross-branch state.

## Active work branches

The frontend foundation/access PR was integrated at `edf58d9` on local `main` and cached `origin/main`.

| Work | Branch and checkout | Owner | Base and publication | Handoff |
| --- | --- | --- | --- | --- |

## Historical records

The [pre-cleanup snapshot](tracker-history-2026-11-01.md) preserves dated activity, previous current-focus details, the roadmap and their original links. The snapshot is frozen: do not append routine updates; correct archival errors explicitly. Historical entries are not current status; follow their links to owning records and evidence.
