# Delivery prompts

Use these as user-facing examples, not mandatory scripts. Replace placeholders with real paths/IDs. A prompt states the task and authorization; repository instructions and canonical documents supply standing rules. Read this guide only when composing a prompt or learning the workflow.

## Sequence

Plan → resolve material decisions → authorize implementation → review evidence/perform required acceptance → close the phase → select the next phase.

A fresh chat can occur at any step. Resume the existing step rather than restarting planning. Implementation permission, verification permission and acceptance are separate; a handoff grants none by itself.

## 1. Plan an increment

```text
Plan <outcome>. Start from <tracker-path> and follow AGENTS.md and
spec-driven-delivery. Prepare the smallest justified P0 scope, acceptance
criteria and phases. Recommend options for material unresolved decisions.
Planning only; do not implement, install or perform external actions.
```

Example: “Plan Business/Branch foundation from docs/planning/TRACKER.md. Vendor topology is still proposed: resolve it before dependent design. Planning only.”

Next: review the proposal and answer blocking questions. Do not approve unresolved choices implicitly.

## 2. Approve and implement

```text
I approve <specific decisions> and <phase/task IDs> in <tracker-path>.
Implement that P0 scope under the repository instructions and verification
policy. Record this authorization, preserve unrelated work and update evidence.
Do not activate later phases or add adjacent features.
```

Example after a plan exists: “I approve the agreed provisioning rules and phase B-01 in the Business module tracker. Implement B-01 only.” B-01 is illustrative, not an existing approved phase.

Next: review changed behavior and evidence; perform any required user acceptance. Routine coding choices inside this scope need no repeated approval.

## 3. Review or verify

```text
Review <phase/task> in <tracker-path> against its acceptance criteria.
Use proportionate checks permitted by project policy. Identify defects,
unverified claims and out-of-scope changes. Review only; report findings
before editing. Do not infer permission for database writes, provisioning
or production/device actions.
```

Example: “Review the completed access increment against its criteria, especially rejected foreign business/branch access. Report findings; no edits.”

For user-run acceptance, share sanitized results and identify the criterion:

```text
For <AC-ID>, I ran <steps> and observed <result>. Here is the sanitized
output: <output>. Record the evidence and limits. Investigate any failure;
do not mark unrelated criteria passed.
```

Next: authorize fixes where needed, or close the phase when required criteria have evidence.

## 4. Fix a verified issue

```text
Fix <specific finding> within <phase/task> in <tracker-path>.
Use the smallest sound change and focused checks under project policy.
Update affected contracts/docs and evidence; do not expand scope.
```

Example: “Fix the disabled-account access rejection identified in review. Keep the existing session contract unless a change is necessary; flag material contract decisions.”

## 5. Close and prepare a fresh chat

```text
Assess whether <phase> meets its recorded exit criteria. If it does, close
it with evidence; otherwise retain pending acceptance/blockers. Update the
owning tracker with changed-file/checkout cautions and one next action.
Give me a concise continuation prompt stating whether the next task is
planning, implementation, review or verification and its authorization.
Do not create a separate handoff file or activate new scope.
```

Example: “Close the accepted foundation phase and prepare a planning-only prompt for vendor isolation. Keep deferred checks explicit.”

Next: paste the generated prompt into a new chat in the same project. Keep it until the new agent locates the canonical state; do not paste the full previous conversation.

## 6. Resume mid-phase in a fresh chat

```text
Resume <task/phase> from <tracker-path> and its current handoff.
Follow AGENTS.md and spec-driven-delivery. Reconcile relevant files and
checkout state before edits; refresh affected context where necessary.
Continue only the recorded authorization. If it is missing or ambiguous,
resolve that boundary rather than assuming permission. Update evidence
and leave one next action.
```

Example for the current proposal: “Resume vendor-isolation review from docs/planning/TRACKER.md. Planning only; no topology is approved. Review the proposal and recommend the next decision.”

## Before sending a prompt

Check that paths/IDs exist, intended mode is explicit, and authorization matches the requested action. Examples do not establish product decisions or available capabilities. Keep secrets and real customer data out of prompts and evidence.
