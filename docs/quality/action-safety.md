# Action safety

Apply this workflow before destructive, hard-to-reverse or materially sensitive changes, including to files, databases, remote resources and permissions.

1. **Inspect:** Identify the exact target, environment, purpose, ownership, dependencies and preservation requirements. Do not assume untracked files are disposable or test databases are empty.
2. **Assess:** Identify consequences and recovery options; verify recovery before relying on it, and state uncertainty. Prefer the narrowest reversible action when appropriate. Protect sensitive data in any backup.
3. **Authorize:** A question about whether an action is possible or advisable is not an instruction to perform it. Explain the material consequences and options, then obtain a clear instruction. Reuse informed authorization within its limits; resolve material ambiguity before acting. Existing stricter restrictions still apply.
4. **Act and verify:** Recheck the target and relevant state, act within authorized scope, and stop on uncertain ownership, target, state or outcome. Verify where practical; report changes, evidence limits and remaining risks without exposing secrets or customer data.

Routine cleanup of clearly task-owned temporary artifacts remains authorized when it preserves required evidence. Do not treat prior work, unknown files, database data or remote resources as temporary merely because they are inconvenient or untracked.

Use available access restrictions and approval controls; this workflow does not establish that backups or recovery exist.
