---
name: rest-api-contracts
description: "Design, implement and review REST API contracts in this repository, including validation, query parameters, responses, errors, headers, retries and concurrency. Use for new or changed HTTP endpoints and contract reviews; exclude unrelated internal changes."
metadata:
  author: "Codex"
  version: "0.4.1"
  project: "ServiceLane POS"
  scope: "REST API contract design, implementation guidance and review; existing API migrations and CI enforcement require separate authorization"
  created: "2026-10-24"
  updated: "2026-10-27"
  compatibility: "NestJS 12 with Fastify, TypeScript 6 and Node.js 24; repository source and owning specifications required; guidance only, no runtime enforcement"
  short-description: "Design and review consistent REST API contracts"
---

# REST API contracts

Load every reference that applies to the task. Do not load references solely because they exist.

Follow the [canonical API convention](../../../docs/architecture/rest-api-convention.md) for new or materially changed HTTP contracts. This is a repository convention, not a claim that all its choices are industry standards.

## Scope and discovery

- Follow applicable AGENTS.md, project scope and the owning tracker. Inspect the module capability index, approved specification and representative HTTP code.
- Identify analysis, specification, implementation and migration authorization separately. This skill grants no database, installation, deployment or external publication permission.
- Existing deviations are findings, not permission for unrelated repairs. Preserve accepted contracts until their migration is authorized.
- Resolve material ambiguity about access, exposure, money/time, mutations, retries and compatibility before dependent implementation.

## Contract and implementation

Before implementing or changing HTTP handling, read the [shared HTTP guide](../../../apps/api/src/infrastructure/http/README.md) for supported components, integration order and limits. Inspect actual bootstrap/module/controller wiring; source availability or a route decorator does not prove activation.

- Reuse applicable shared validation integration, response formatting, error formatting and correlation components; do not create parallel implementations in modules. If a documented limitation prevents reuse, explain the gap and smallest alternative before adding another mechanism.
- Keep endpoint parsing rules, filter/sort allowlists, public field selection and semantic-error mappings module-owned. Application/domain code must not depend on HTTP pipes or formatters.
- Preserve existing contracts until migration is authorized. Shared components are registered for two approved endpoint contracts; inspect the shared guide for current adoption. Do not mark additional methods or migrate legacy contracts as incidental cleanup.

Use the shared DtoValidationPipe (Nest ValidationPipe + class-validator/class-transformer) and concrete module-owned DTO classes for migrated HTTP inputs. Disable implicit conversion; retain application/domain normalization and invariants. Do not introduce a competing generic parser pipe.

For TypeScript HTTP contract work, read the [type-safety examples](references/type-safety.md). Follow the canonical requirements; examples do not authorize new dependencies.

For listing/filter/pagination work, read the [query parameter examples](references/query-parameters.md).

Use [the endpoint template](templates/endpoint-contract.md) for a new endpoint or material contract change in its owning feature documentation. Adapt it; link existing canonical schemas instead of duplicating them. Small changes do not need new documents.

HTTP code owns structural validation, public field selection and status/header translation. Application operations own use-case coordination and transactional authorization. Domain code retains business invariants needed by every caller. Preserve session/CSRF, trusted installation scope and the current authorized transaction model.

Use explicit public contracts and supported module interfaces. Do not expose database rows or add generic controller/filtering frameworks. A matching application result may be reused deliberately without ceremonial mapping classes.

## Verification and handoff

For implementation/integration, verify applicable shared-component reuse and actual registration against the shared guide; report unsupported cases or wiring gaps.

Before completing API design, implementation or review, apply the relevant [verification checklist](references/enforcement.md#verification-checklist). Distinguish source review from executed checks and report material gaps; invoking this skill does not prove compliance. Run the smallest relevant existing checks and meaningful negative cases. Static checks do not prove authorization, runtime field selection or transaction safety.

Report contract changes, compatibility impact, verification results/limits and unresolved decisions. Follow the repository incident-learning requirements. CI enforcement and migrations remain separately scoped.

## Metadata maintenance

On substantive changes, update `metadata.updated`; adjust `metadata.version` when the skill's documented contract changes. Preserve attribution and creation date.
