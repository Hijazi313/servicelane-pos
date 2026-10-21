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

On 2026-10-20 the full scan inspected 15 source files and reported one existing `ERROR_HTTP_STATUS` violation in `authentication/application/access-policy.ts` (`AccessError` constructor). Menu and Orders passed the explicit scoped scan. Authentication was not changed or exempted. At that checkpoint the strict scan failed on that source issue; checker tests passing does not mean the repository passes.

This is a syntax guard, not a complete architecture proof. It does not perform cross-file type/data-flow analysis, follow arbitrary barrel aliases, resolve computed import/member names or discover every free-form numeric status mapping. Arbitrary property mutation through helper calls can escape detection. Recognized errors are Error-derived/local subclasses, error-like names and known exception aliases; a status-named property with another meaning can require human review. No rule is waived automatically. Authorization, ownership, transactions and other architectural constraints still require their existing review.

## GitHub Actions verification — 2026-10-21

User authorized committing/pushing the checker and verifying GitHub integration, without merge. [Run 39484691271](https://github.com/Hijazi313/servicelane-pos/actions/runs/39484691271) at exact source head `c7098f1ca7ad6a33a942b88fef76825459e804b3` established:

- Node/pnpm setup, exact pnpm@12.11.2 assertion and frozen dependency installation with lifecycle scripts disabled passed.
- All seven checker tests passed on GitHub's Ubuntu runner.
- The strict full scan inspected 15 files and failed with exactly the existing Authentication AccessError status finding, exit code 1. The workflow conclusion is **failure**, not a green repository check. The integration successfully reaches and enforces the checker.

Earlier retained runs: [39484253754](https://github.com/Hijazi313/servicelane-pos/actions/runs/39484253754) at `44d62aa` stopped before checker execution because pnpm manager metadata was missing from the lockfile; [39484553459](https://github.com/Hijazi313/servicelane-pos/actions/runs/39484553459) at `eb260ee` verified the manager pin but stopped on the old peer-policy config location. These are setup failures, not checker results.

CI now uses action-managed pnpm with `pnpm_config_pm_on_fail: ignore` and an explicit version assertion, following the [external manager setting](https://github.com/pnpm/pnpm.io/blob/main/docs/settings/cli.md). The existing `autoInstallPeers: false` policy is also declared in workspace configuration. Frozen application dependencies and disabled lifecycle scripts remain enforced; the lockfile/application dependency graph is unchanged. No local installation or database work occurred.

The workflow is triggered by PR creation/reopening/new commits and pushes to main. Required-check branch protection has not been configured or verified by this task; CI execution alone does not make it a mandatory merge gate. Resolve the Authentication finding under separate source authorization before expecting the full gate to pass. No exception/baseline, incident closure, merge or production-readiness claim follows from this verification.

## Local Authentication correction — 2026-10-21

The user subsequently authorized implementing the Authentication error-boundary correction without a commit. The current local scan passes (15 files, zero findings); the existing seven checker tests also pass against it. [Authentication maintenance evidence](../../../docs/planning/business-access/phase-tracker.md#authentication-error-boundary-correction--2026-10-21) owns the source/behavior checks. At the local handoff this patch was uncommitted and had not run on GitHub. The subsequent authorized publication/result is recorded below. Earlier failed remote runs remain accurate historical evidence; they are not relabeled green.

## Authentication correction verified on GitHub — 2026-10-21

User approved commit/push and exact-head CI verification. At source commit `ba723463c140f0c34a7d7bfb185933522c86ba8b`, [HTTP boundaries run 39563398375](https://github.com/Hijazi313/servicelane-pos/actions/runs/39563398375) concluded **success**: pinned runtime/version assertion, frozen installation, all seven checker tests, and the full 15-file scan (zero violations) passed. [PR title run 39563398336](https://github.com/Hijazi313/servicelane-pos/actions/runs/39563398336) also passed. No baseline, suppression or rule weakening was used.

This supersedes the earlier known-red source result for the corrected head only. The workflow exercises the architecture guard; the 75 Authentication/consumer/recovery tests are local offline evidence, not an additional GitHub test suite. Syntax-analysis limits above, feature/database acceptance, incident review and required-check branch protection remain separate. No merge or database work.
