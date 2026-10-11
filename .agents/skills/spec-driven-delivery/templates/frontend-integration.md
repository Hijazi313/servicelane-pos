# <Feature name> — Frontend integration

Specification: [spec.md](spec.md)
Availability and verification: [phase-tracker.md](phase-tracker.md#evidence-and-availability)
Contract status: <Proposed / approved; link approval or decision>

## Consumer journey

<Applications/screens, user actions and intended UX. Link relevant requirement and acceptance IDs. Mark planned behavior clearly; approved does not mean available.>

## API usage

Canonical schemas: <Links, or explicitly pending>

| Action | API operation / schema link | Preconditions and permissions | Response semantics / UI behavior |
| --- | --- | --- | --- |
| <Action> | <Operation> | <Server-authoritative access and business eligibility> | <Meaning and user-visible result> |

Do not copy full schema definitions. Use approved examples only when they clarify integration; label illustrative examples. Backend code is not a substitute for this consumer guidance.

## States and failures

- Loading/pending: <Feedback and duplicate-action handling>
- Empty/unavailable: <What is displayed; unsupported behavior>
- Success: <Authoritative result and refresh requirements>
- Validation/authorization: <Safe messages and recovery>
- Retry/conflict: <When retry is safe; when refresh/review is required>
- Connection/unexpected failure: <Fallback without implying success>

Include only applicable states; link detailed rules to the specification.

## Compatibility and limits

<Deferred journeys, relevant consumer migration steps and decision links. Availability/evidence remain authoritative in the tracker.>
