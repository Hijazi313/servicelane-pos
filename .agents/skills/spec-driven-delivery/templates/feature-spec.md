# <Feature name> — Specification

Owning module: <Link>
Specification status: <Proposed / approved / superseded; approval evidence when available>
Progress and availability: [phase-tracker.md](phase-tracker.md)

## Outcome and scope

<User, concrete workflow and intended outcome.>

| ID | Requirement | Priority | Why needed now / simpler alternative considered |
| --- | --- | --- | --- |
| R-01 | <Behavior> | <Product P0 / phase P0 / P1> | <Evidence and consequence of deferral> |

Excluded or deferred: <Explicit boundaries; reasons for P1>

## Rules and ownership

- Business rules/invariants: <What must remain true and why>
- Owned data and public capabilities: <Module boundaries>
- Dependencies and consistency: <Relevant interactions, transaction boundaries and concurrent changes>
- Access/vendor isolation: <Applicable authorization and isolation behavior>
- Compliance: <Applicable requirement/decision links or unresolved applicability>

## Intended contracts and failure behavior

<Proposed/approved interface semantics, inputs/outputs and consumers. Link canonical schemas when available. Specification approval does not imply implementation availability.>

<Relevant validation, errors, retries, conflicts and unavailable behavior. Include only cases this feature actually affects.>

## Acceptance examples

| ID | Requirement | Scenario / input | Expected observable outcome | Required evidence |
| --- | --- | --- | --- | --- |
| AC-01 | R-01 | <Given/when, including relevant negative cases> | <Then> | <User-run behavior / source fact / device or recovery evidence> |

## Open decisions and risks

<Link decisions.md when material choices arise; otherwise keep brief questions here. Do not duplicate decisions. Short risks/exceptions include impact and removal condition. Link frontend-integration.md for consumer guidance when relevant; schemas remain canonical for payloads.>

Use stable acceptance IDs and linkable headings for criteria that tasks reference. For larger criteria, place the detailed scenario under a heading such as `### AC-01 — <Outcome>` and link to it from the tracker. Keep small criteria in the table when a section link plus ID is sufficient; do not duplicate scenario text in both places.
