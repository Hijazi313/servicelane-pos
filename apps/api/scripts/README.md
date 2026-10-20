# HTTP boundary check

This focused syntax check enforces selected parts of the [architecture boundary rule](../../../docs/architecture/README.md#file-naming-and-responsibility-boundaries). It uses the already-installed TypeScript parser; it does not import the application, load `.env`, compile production code or access a database.

From the repository root:

```sh
pnpm test:architecture
pnpm check:architecture
```

The first command tests the checker with passing/failing fixtures. The second scans **all** `src/modules/*/domain/**/*.ts` and `application/**/*.ts` (including TSX) and exits 1 if it reports a violation or cannot complete. Diagnostics contain file, line, column and rule. No baseline or exception list is applied. CI runs both commands.

For focused investigation only (not a replacement for the full CI gate):

```sh
pnpm --filter @servicelane/api check:architecture --module menu --module orders
```

## What it catches

| Rule | Examples |
| --- | --- |
| `HTTP_IMPORT` | Fastify/Express/Node HTTP modules, module `http/` entry points, controller/filter/guard/decorator files, known Nest HTTP symbols and wildcard transport reexports. Domain code additionally rejects Nest imports because it must be framework-independent. |
| `HTTP_EXCEPTION` | `new HttpException(...)` and known Nest HTTP exception constructors, including named import aliases. |
| `ERROR_HTTP_STATUS` | `status`, `statusCode`, `httpStatus`, `httpStatusCode`, `getStatus` or `getStatusCode` declared/assigned on recognized error classes or accepted by their constructors. |
| `PARSE` | TypeScript syntax the parser cannot read. The file cannot silently pass. |

Static imports, reexports, literal dynamic imports, import-equals, require and import types are inspected. Local error inheritance is followed. Application DI imports (`Injectable`, including normal namespace use) and ordinary account status fields are permitted. Files under `http/` are outside this rule: that is where translation belongs.

Example rejected fixture:

```ts
export class MenuError extends Error {
  constructor(readonly status: 400 | 409) { super(); }
}
```

Use a semantic reason/code instead and translate it in `http/`. That code can still represent many different HTTP responses depending on the consumer's transport policy.

## Current real-source result and limits

On 2026-10-20 the full scan inspected 15 source files and reported one existing `ERROR_HTTP_STATUS` violation in `authentication/application/access-policy.ts` (`AccessError` constructor). Menu and Orders passed the explicit scoped scan. Authentication was not changed or exempted. The strict CI draft will fail until that source issue is resolved under separate authorization; checker tests passing does not mean the repository passes.

This is a syntax guard, not a complete architecture proof. It does not perform cross-file type/data-flow analysis, follow arbitrary barrel aliases, resolve computed import/member names or discover every free-form numeric status mapping. Arbitrary property mutation through helper calls can escape detection. Recognized errors are Error-derived/local subclasses, error-like names and known exception aliases; a status-named property with another meaning can require human review. No rule is waived automatically. Authorization, ownership, transactions and other architectural constraints still require their existing review.

The GitHub Actions workflow is source-only until published; it has not been run remotely. Its dependency installation step is declarative CI setup, not local installation authorization.
