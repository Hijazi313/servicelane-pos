# <Feature name> — Phase tracker

Parent module/phase: <Link and ID>
Specification: [spec.md](spec.md)
Status: proposed
Owner: <Assigned agent/person>
Collaboration: <Link agent-collaboration.md when used; assignments live there>

Active phase: <ID or none>

## Phase authorization

Approving instruction: <Link or concise dated user instruction; pending if not authorized>

Approved scope: <Phase/requirement IDs and limits; distinguish spec approval from permission to implement>

Verification limits: <Applicable policy or explicit authorized change>

## Assignment

<If agent-collaboration.md exists, link to its assignments without copying them. Otherwise record the solo owner's allowed files/responsibilities.>

Dependencies: <Links to agreed contracts and prerequisites; do not duplicate the spec>

## Feature phase tracker

| Phase | Outcome / P0 tasks | Status | Acceptance IDs / exit criteria | Evidence |
| --- | --- | --- | --- | --- |
| <ID> | <Focused outcome> | proposed | <Observable result> | <Link or pending> |

Detail only the active phase. Do not subdivide trivial tasks merely to populate this table.

## Active phase tasks

| Task | Status | Acceptance link / expected evidence | Dependency |
| --- | --- | --- | --- |
| <Focused P0 action> | <Status> | <Link to spec criterion or required evidence> | <Prerequisite or none> |

Link to the actual criterion section; an ID alone is a lookup key, not evidence. Keep detailed assignments in the collaboration document when present. A checklist can replace this table if equally clear.

## Completion shape

- Capabilities after this phase: <Intended at entry; reconcile with evidence at closeout>
- Still unavailable/deferred: <Important exclusions>
- Next-phase boundary: <Concrete API, model or workflow available for subsequent work; distinguish planned from evidenced availability>

## Evidence and availability

| Acceptance ID / capability | Implementation availability | Evidence type, source and date | Result / limits |
| --- | --- | --- | --- |
| <AC-01> | <Unavailable / partial / implemented> | <Source inspection / user-run / device or operational verification; link> | <Outcome or pending> |

Report `implemented, unverified` when implementation exists without behavioral evidence. Source evidence alone does not establish runtime or user acceptance. Keep required pending acceptance explicit; follow the repository verification policy.

## Handoff

- Changed files: <Paths>
- Decisions: <Links or concise notes>
- Completed / remaining: <Current state>
- Blockers / next action: <Concrete dependency>
- Verification: <Evidence, pending user acceptance and checks not run>
