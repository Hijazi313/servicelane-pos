# Agent incidents

## Adoption and review

- Adopted: 2026-10-17, user instruction to activate the reviewed skill in this project; creation and automatic maintenance of this log approved.
- Procedure: [agent incident learning](../../.agents/skills/agent-incident-learning/SKILL.md).
- Writer: current solo agent; for parallel work, the named coordinator serializes entries. Task assignments identify the coordinator before concurrent writes.
- Review owner: project owner (user). Default next review: 2026-11-17, or module closeout sooner. Date uses Asia/Karachi; user may revise it. This is an in-workflow review date, not a scheduled reminder.
- Pilot: begin on adoption; assess real use after approximately two weeks (2026-10-31). No production reliability or pilot result is claimed.
- Policy: agents record/correct evidence within authorization; only explicit user review authorizes prevention-policy changes or incident closure.

## Entries

Entries below assess already-observed events in this active thread following the user’s instruction to apply the adopted skill. No repository-wide or unrelated historical audit was performed. Sandbox evaluation incidents are fictional fixtures and are not imported here. Severity and correction status remain provisional; only the user closes entries or decides prevention proposals.


## INC-20261017-01 — Workflow recommendation omitted an existing incident-learning draft

- Severity / status: S3 / corrected. Observed impact: the user had to request another inspection to obtain a relevant, grounded recommendation.
- Violation and evidence: On 2026-10-17, when asked about mistakes and skills, the agent recommended tightening `spec-driven-delivery` without inspecting the current workspace for relevant guidance. After the user said “Check again. You might find something,” read-only `git status` and file inspection revealed `docs/drafts/agent-incident-learning/SKILL.md`, then staged/modified and explicitly inactive. The agent’s next response acknowledged missing it and corrected the recommendation. This fell short of AGENTS.md’s requirement to verify relevant evidence when challenged and reuse/discover current guidance before making consequential workflow recommendations. The draft’s presence in the inspected workspace is established; its availability in the earlier published skill catalog is not assumed.
- Impact: Additional user correction and rework in this thread. No skill or guardrail was modified by the premature recommendation.
- Correction: Agent read the draft and recording rules, explained its inactive/adoption boundary, and withdrew the immediate policy-change recommendation in the response beginning “I found the agent-incident-learning draft skill.” Current adopted source is [SKILL.md](../../.agents/skills/agent-incident-learning/SKILL.md); adoption does not retroactively make the earlier draft active.
- Prevention / user review: Before recommending workflow changes in response to a challenge, inspect relevant current skill files and dirty guidance. Proposal only; no instruction/skill change performed / pending.

## INC-20261017-02 — Terminal failure cause presented more conclusively than retained evidence supports

- Severity / status: S2 / corrected. False verification/diagnosis confidence: the successful retry did not establish the original failure’s cause.
- Violation and evidence: In the five-minute BA-02 retry, the agent stated “The terminal helper needed to wait for the child process after the terminal closed; that change allowed the retry to capture the setup result.” The original [interrupted-run evidence](../../apps/api/tests/evidence/ba02-bootstrap-interrupted.json) records only `stage=bootstrap`, `category=sanitized-operation-failure` and subsequent ownership/cleanup observations. It retains no subprocess exit/error detail sufficient to establish a PTY EOF/exit race. [Commit 771f6b0](https://github.com/Hijazi313/servicelane-pos/commit/771f6b0832e6c7217fa1d572a345ffc3e80aee12) contains the helper wait change; an offline EOF-before-child-exit check and [successful retry evidence](../../apps/api/tests/evidence/ba02-backend.json) establish that the changed helper handles that case and the retry passed, not that this caused the original interruption. AGENTS.md requires evidence-based conclusions and explicit uncertainty; the verification policy requires accurate evidence limits.
- Impact: Misleading causal explanation to the user. The original run committed synthetic setup records before its acknowledgement failed; ownership was independently established and cleanup was explicitly authorized. Those events are context, not proof that this diagnosis caused the committed state. No data exposure, corruption or outage is established.
- Correction: Current incident review explicitly retracts certainty: **the initial bootstrap acknowledgement failure’s cause remains unconfirmed**. The helper correction, regression observation and retry success remain valid separate facts. Historical evidence is preserved; no unsafe reproduction or product change is needed to correct this claim.
- Prevention / user review: Distinguish observed failure, candidate explanation, fix verification and confirmed root cause; retain sanitized diagnostic categories needed to support a causal claim. Proposal only / pending.

## INC-20261017-03 — Local installation treated as a confirmed single-process topology

- Severity / status: S3 / open. Observed impact: an unsupported deployment assumption entered the priority/acceptance explanation and owning tracker.
- Violation and evidence: After the user questioned multi-worker tests, the agent justified deferral with “For the current single-process restaurant installation.” The confirmed scope specifies one business per local/LAN installation and a local PostgreSQL database; the user subsequently described installation on a friend’s computer. Neither statement establishes an API-process count. The [BA-02 acceptance record](../planning/business-access/phase-tracker.md#deferred-verification-and-release-limits) nevertheless says “P1 for the current single-process development increment.” This conflicts with the requirement in AGENTS.md and [decision-making guidance](../decision-making.md) to distinguish supported requirements/constraints from assumptions. User acceptance of the development increment is explicit and remains valid; it does not prove the factual topology assertion.
- Impact: A proposed simplification was presented as an established fact when explaining which verification could wait. Multi-process behavior remains unverified; no actual multi-instance deployment or failure is established.
- Correction: Owner: current agent. Acknowledge that process count is unspecified; retain multi-worker verification as deferred under the user-accepted scope without claiming a confirmed single-process deployment. The owning tracker wording still needs correction within an authorized documentation update; do not change application behavior, reopen BA-02 or activate BA-03 on the incident log’s authority.
- Prevention / user review: Tie verification deferrals to the explicit accepted scope, and label proposed process/deployment limits as proposals until decided. No new mandatory testing or policy change proposed / pending.
