# API application guidance

## Responsibility

Own server-side business behavior, authorization, HTTP interfaces and persistence within each module's boundaries. Preserve existing public contracts and server-resolved business and branch scope.

## Stack

The application uses Node.js, TypeScript, NestJS with the Fastify adapter, and PostgreSQL through Drizzle ORM and `pg`. The [package manifest](package.json) owns dependency versions; the [architecture guidance](../../docs/architecture/README.md) owns the stack and module boundaries.

## Guidance

For backend implementation or review, use the owning module's `docs/README.md`, capability index and relevant feature specification and tracker. For HTTP contract work, follow the REST API skill routing in root instructions and inspect the [shared HTTP guide](src/infrastructure/http/README.md).
