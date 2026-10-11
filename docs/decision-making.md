# Decision making and MVP priorities

Read when defining scope, classifying requirements, evaluating a request or proposing consequential changes.

## Critical engineering judgment

- Evaluate user prompts, agent proposals and previously accepted decisions against the business outcome, applicable obligations, established practices and maintenance cost. Prior agreement does not make a decision beyond review.
- Identify material contradictions, unsupported claims, boundary violations and unnecessary complexity. Explain the consequence and recommend the smallest sound alternative. Be direct and respectful; avoid automatic agreement and speculative objections.
- Distinguish legal or contractual requirements, documented technical constraints, industry conventions and project preferences. Cite current authoritative evidence when claiming a requirement or standard. A vendor example is a reference, not proof of compliance or a universal standard.
- Consider compliance in every consequential decision, proportionately to its impact. Use the compliance guidance for affected workflows; routine catalogue work does not need an unrelated compliance checklist.
- Do not silently override the user's business intent. Where an alternative changes scope or an unresolved choice materially changes behavior, present the trade-off and obtain the necessary decision. Proceed autonomously with routine choices inside approved scope.
- Prefer familiar framework conventions and the simplest maintainable implementation. Add abstractions, dependencies and extensibility only for demonstrated needs. Do not invent requirements to justify an agent's proposed solution.

## P0 and P1

- Product P0 means necessary for the agreed MVP to operate correctly, safely and in accordance with applicable obligations. Phase P0 means necessary to achieve that phase's explicit exit condition or resolve a prerequisite for it. State which meaning is intended.
- P1 is useful work that can be deferred without invalidating the agreed MVP or phase outcome. List it separately with a reason; listing does not authorize implementation.
- A later module's product P0 does not automatically belong in the current phase. Build one approved increment at a time and retain later requirements as objectives until discovery justifies detail.
- A small first increment is not the complete MVP. Do not omit an essential restaurant workflow and then redefine the release as ready.
- Compliance, financial integrity and essential recovery requirements cannot be downgraded simply because they are difficult. Confirm applicability and implement them when their affected workflow enters scope.

## Challenge every P0 label

Before accepting a requirement as P0, answer briefly:

1. Which user, concrete workflow or applicable obligation requires it?
2. What specifically fails if it is deferred beyond this phase or the MVP?
3. What evidence supports that consequence, and which assumptions remain open?
4. Is there a simpler acceptable approach that achieves the same outcome?
5. What observable acceptance outcome proves it is sufficient?

If these answers are weak, mark the requirement as unresolved or P1. Do not classify speculative scale, marketing features, decorative analytics, generic engines or hypothetical extensibility as P0 without evidence. Necessary complexity must be justified, not automatically rejected.

## Planning and scope changes

- In each active module specification, record the objective, P0 requirements with short rationale and acceptance outcomes, P1 deferrals, and unresolved decisions. Keep it concise and avoid duplicate trackers.
- Reassess P0 scope at phase entry and when new evidence changes the plan. Review agent-added work for whether it serves an approved requirement; remove unjustified additions from the proposal.
- Do not add adjacent improvements during implementation merely because they are convenient. Record useful follow-ups as P1; seek a scope decision when a discovered dependency changes the agreed deliverable.
- Record consequential architecture decisions in the architecture documents and compliance applicability in the compliance documents. This document governs judgment rather than duplicating those rules.
