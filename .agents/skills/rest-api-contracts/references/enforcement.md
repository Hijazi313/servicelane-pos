# Enforcement and evidence

The skill guides decisions; CI rejects specific patterns. Neither proves API correctness. Runtime adoption and CI changes are deferred from this documentation increment.

## Static candidates

Reuse the existing [TypeScript-parser checker](../../../../apps/api/scripts/README.md). Candidate additions: business route prefixes, explicit route access declarations and public response annotations. Preserve existing transport-import/status rules. For every added rule define prohibited/valid examples, current findings and detection limits. An annotation cannot prove JSON validation or field exclusion; a decorator cannot prove authorization. Do not suppress violations to get green CI.

## Behavioral checks

Use focused existing HTTP tests for relevant cases:
- Status, success envelope, empty collection, Problem Details and media types.
- Correlation before controller execution; safe unexpected-error logs without duplicate stacks/secrets.
- No content for 204; preservation of Location/Allow/authentication/Retry-After where applicable.
- Unknown fields/query keys, duplicate scalars, invalid values, malformed JSON/media/size limits.
- Filter combinations, deterministic pagination, invalid/mismatched cursors and scope reauthorization.
- Explicit response field selection and absence of sensitive fields.
- Meaningful retry/revision behavior and transactional authorization where affected.

Verify adapter behavior before enforcing Accept negotiation. Test shared behavior centrally, then endpoint-specific risks. Do not create identical tests for every controller or load .env/database from static checks. Database verification retains separate authorization.

## Review and rollout

Human/agent review still covers resource boundaries, permissions, transactions, money/time, query cost/indexing, retry retention and compatibility. Record real existing deviations in the owning tracker; no empty parallel register. Checker fixtures and real-source scans are separate evidence. Required merge checks need separately configured branch protection. Local green results never grant merge permission.

For skill behavioral validation, use realistic tasks in an isolated scratch location with no application edits/database access. Evaluate whether it preserves existing contracts, distinguishes project policy from RFCs, rejects unsafe query/access designs and identifies unresolved choices without speculative implementation. Report actual observations, not a claim that reading the skill proves compliance.
