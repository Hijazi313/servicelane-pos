# Enforcement and evidence

The skill guides decisions; CI rejects specific patterns. Neither proves API correctness. Runtime adoption and CI changes are deferred from this documentation increment.

## Verification checklist

After designing or changing an API, check the affected contracts and code:

- [ ] Inputs have runtime validation and explicit types; outputs have explicit public contracts and deliberate field selection.
- [ ] Error responses follow the agreed Problem Details format.
- [ ] Transport validation occurs at boundaries; application/domain business invariants remain enforced.
- [ ] Query parameters follow naming, allowlist, parsing and limit conventions.
- [ ] Collections have deterministic ordering and pagination, or an explicitly bounded complete-result contract.
- [ ] Responses use the agreed envelope, statuses and applicable headers.
- [ ] Business/branch scope comes from trusted authorization context.
- [ ] Changes preserve compatibility, including field meanings, enum behavior, defaults and ordering; additive fields are not automatically safe.
- [ ] Relevant contracts, types and documentation accompany the implementation.
- [ ] Mutations define retry safety and applicable revision checks; unsafe automatic retries are explicitly documented.
- [ ] Retry-protected operations prevent concurrent duplicates through atomic persistence/uniqueness or an equivalent justified design; changed payloads with the same key fail explicitly.
- [ ] In-flight duplicate behavior is deliberate, and retry-key retention covers the supported retry window, including queued/delayed replay only where that workflow exists.
- [ ] Unexpected failures are safely reported and observable without exposing secrets.

For design, verify that the contract specifies the behavior; do not claim runtime verification. For implementation, use focused executed checks where behavior matters. For review, assess the diff and available evidence. Identify applicable items as verified, not applicable with a reason, or unverified with missing evidence. Report relevant results and material gaps without copying the entire checklist into every handoff. Do not expand scope, add redundant tests or access a database merely to complete this checklist.

## Red flags

Look for concrete mismatches in affected work. Confirm context, correct within authorization or report the gap; do not broaden the task automatically.

- One endpoint returns a resource on one path and `{ data: resource }` on another, without a documented typed variant.
- One failure returns Problem Details while another returns `{ error: message }` or HTTP 200 with `success: false`.
- Controllers cast raw input to a DTO, while multiple internal callers repeat transport parsing. Keep boundary validation distinct from legitimate domain invariant checks.
- Existing fields change type or disappear, or default ordering changes without a compatibility assessment.
- A growing list returns every row, or pages sort only by a nonunique timestamp without a tie-breaker. Explicitly bounded configuration lists are an exception.
- Routes encode CRUD operations as `/createOrder` or `/getOrders` instead of resources and HTTP methods. Explicit business actions such as `/orders/:id/cancel` may be appropriate.
- Third-party JSON is cast to a trusted type and used in pricing, persistence or output without validating the consumed fields; unsafe content reaches an output sink without appropriate handling.
- An idempotency-key SELECT is followed by an INSERT with no atomic claim, effective uniqueness constraint or equivalent serialization. A prior SELECT alone does not guard concurrent execution.
- A retry loop generates a fresh UUID or timestamp-based key on every attempt. A UUID generated once per logical operation and reused is valid.
- The same key with a different normalized payload silently returns the first result; concurrent in-flight duplicates have no deliberate response behavior.
- Key retention expires before a supported client retry or queued replay can arrive, allowing the operation to execute again.

## Static candidates

Reuse the existing [TypeScript-parser checker](../../../../apps/api/scripts/README.md). Candidate additions: business route prefixes, explicit route access declarations and public response annotations. Preserve existing transport-import/status rules. For every added rule define prohibited/valid examples, current findings and detection limits. An annotation cannot prove JSON validation or field exclusion; a decorator cannot prove authorization. Do not suppress violations to get green CI.

## Type safety checks

Use the existing project typecheck for strict contracts and exhaustive unions. TypeScript alone does not reject every floating promise or unsafe assertion; suitable typed lint rules can provide additional coverage only when separately authorized. Runtime validation and response-field tests remain necessary. Do not claim compiler success proves sanitized responses or handled background failures.

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
