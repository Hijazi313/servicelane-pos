---
name: rest-api-contracts
description: "Design, implement and review REST API contracts in this repository, including validation, query parameters, responses, errors, headers, retries and concurrency. Use for new or changed HTTP endpoints and contract reviews; exclude unrelated internal changes."
metadata:
  author: "Codex"
  version: "0.3.0"
  project: "ServiceLane POS"
  scope: "REST API contract design, implementation guidance and review; existing API migrations and CI enforcement require separate authorization"
  created: "2026-10-24"
  updated: "2026-10-24"
  compatibility: "NestJS 12 with Fastify, TypeScript 6 and Node.js 24; repository source and owning specifications required; guidance only, no runtime enforcement"
  short-description: "Design and review consistent REST API contracts"
---

# REST API contracts

Follow the [canonical API convention](../../../docs/architecture/rest-api-convention.md) for new or materially changed HTTP contracts. This is a repository convention, not a claim that all its choices are industry standards.

## Scope and discovery

- Follow applicable AGENTS.md, project scope and the owning tracker. Inspect the module capability index, approved specification and representative HTTP code.
- Identify analysis, specification, implementation and migration authorization separately. This skill grants no database, installation, deployment or external publication permission.
- Existing deviations are findings, not permission for unrelated repairs. Preserve accepted contracts until their migration is authorized.
- Resolve material ambiguity about access, exposure, money/time, mutations, retries and compatibility before dependent implementation.

## Contract and implementation

For TypeScript HTTP contract work, read the [type-safety examples](references/type-safety.md). Follow the canonical requirements; examples do not authorize new dependencies.

For listing/filter/pagination work, read the [query parameter examples](references/query-parameters.md).

Use [the endpoint template](templates/endpoint-contract.md) for a new endpoint or material contract change in its owning feature documentation. Adapt it; link existing canonical schemas instead of duplicating them. Small changes do not need new documents.

HTTP code owns structural validation, public field selection and status/header translation. Application operations own use-case coordination and transactional authorization. Domain code retains business invariants needed by every caller. Preserve session/CSRF, trusted installation scope and the current authorized transaction model.

Use explicit public contracts and supported module interfaces. Do not expose database rows or add generic controller/filtering frameworks. A matching application result may be reused deliberately without ceremonial mapping classes.

## Verification and handoff

Read [enforcement guidance](references/enforcement.md) when implementing or reviewing checks. Run the smallest relevant existing checks; exercise meaningful negative behavior, not only happy paths. Static checks do not prove authorization, runtime field selection or transaction safety.

Report contract changes, compatibility impact, verification results/limits and unresolved decisions. Follow the repository incident-learning requirements. CI enforcement and migrations remain separately scoped.
