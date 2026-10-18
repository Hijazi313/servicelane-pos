# Menu catalogue — Decisions

Date: 2026-10-18. [Specification](spec.md); approval and authorization state belongs to the [tracker](phase-tracker.md#authorization--2026-10-18). MN-D01–06 and the linked MN-01 scope were approved by explicit user instruction on 2026-10-18; source/offline-check authorization and evidence limits are owned by the tracker. User-confirmed direction: configurable sizes, extras and combos, simple maintainable code, existing authorization reuse.

## MN-D01 — Configuration ownership

Use business-owned Menu definitions for the current installed branch. Business identity/currency remain Business-owned; no generic Business settings store or global combo-mode switch. Branch overrides would require field ownership, inheritance and precedence rules; recommend deferring them while operation is single-branch. User's “business settings or branch” instruction does not settle those rules. Consequence: configurable APIs now, settings UI later.

## MN-D02 — Sizes and extras

Absolute prices per item-local variant; optional item-local extras shared across sizes, selected at most once, configurable maximum. Recommend deferring required standalone extras and combo-local extras because no confirmed first workflow needs them. This is a phase boundary, not a claim those behaviors are unsupported forever. Add-on and combo options retain separate typed meanings; share small pure selection/surcharge validation where semantics match. Table layout is an implementation choice; do not introduce nullable generic option records merely to reduce model count.

## MN-D03 — Configurable combos

Support fixed components and min/max choice groups, allowed ordinary-item variants and explicit surcharges. User-confirmed configurability supersedes the earlier fixed-only proposal. The later agent suggestion to restrict all groups to “choose exactly one” is withdrawn: it lacks a business basis. No nested combos, conditional engine or component extra trees. Each referenced variant carries a positive integer component quantity; group bounds count distinct choices, not component units.

## MN-D04 — Existing authorization and Menu policy

Reuse fixed-role RBAC (`administrator`, `staff`) plus installation/business and explicit branch-grant checks, current session/account state and password-change restrictions. Existing access does not imply Menu permissions: recommend administrator maintenance and administrator/staff active read/resolve. No second authorization system, custom role designer or configurable permission engine. MN-00 integrates supported transactional reuse before MN-01 writes; [Authentication owns its contract and acceptance](../../../../authentication/docs/features/access/spec.md#mn-00--transactional-module-authorization).

## MN-D05 — Money and input defaults

User-approved revision on 2026-10-18: use a checked-in standard minor-unit registry, replacing runtime-derived precision. Actual Node 24.21.0 Intl returned PKR=0, while Unicode standard data distinguishes PKR digits=2 from cashDigits=0. The user explicitly selected a standard registry before dependent implementation continued. [currency-precision.ts](../../../domain/currency-precision.ts) contains the current numeric minor-unit entries from [SIX List One](https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml), retrieved 2026-10-18, with publication date and source SHA-256. No runtime network fetch, library installation, default-two fallback or restaurant-specific currency condition. Unsupported/non-numeric currency codes fail closed; supported Menu currencies are the intersection of Business's accepted codes and numeric registry entries. Standard precision is independent of cash/display rounding.

An offering's currency/scale interpretation is stored and checked; a mismatch with current configuration/registry rejects rather than silently converting amounts. Registry updates require review; currency conversion with an existing catalogue needs a separate migration decision.

Precision must be fixed before money parsing/storage contracts, not before unrelated source work. Duplicate offering display names are allowed; stable IDs identify records. Within one item/group require distinguishable size/option labels after trimming/case normalization. Technical payload, string and numeric bounds are routine implementation choices to document before the affected contract is complete; no owner decision is required unless they constrain an actual business workflow.

## MN-D06 — Revisions, serialization and freshness

Use per-offering revisions for stale edits while all definition writes share MN-00's existing access transaction lock. This removes the previous catalogue-wide revision's false conflicts without inventing dependency-lock ordering. Revalidate dependencies after the lock is acquired; inactive components can later make existing combos unavailable. Do not require a perpetual “every stored combo has active dependencies” invariant.

Resolution uses one coherent Menu snapshot, not revision comparisons across a dependency graph. It is a nonbinding preview. This deliberately retains short serialized writes, including contention with access operations; it does not claim high concurrent throughput. Callbacks must perform bounded database work only. If the auth lock's lifetime changes, revise and verify Menu write coordination before dependent changes. [Spec](spec.md#writes-and-reads) owns behavior; MN-00 owns lock/transaction lifetime.
