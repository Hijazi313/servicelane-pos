# Business/Branch foundation — Specification

Status: BA-01 provisioning accepted; BA-02 supplies authenticated context/access. BA-03 acceptance scope revised by user on 2026-10-17; evidence and acceptance status belong to the joint tracker.
Ownership: Business module. Joint progress: [phase-tracker.md](../../../../../../../../docs/planning/business-access/phase-tracker.md).

## Outcome and provenance

An operator provisions one independent restaurant business and one explicit operational branch in its dedicated installation. Authenticated staff receive only their permitted business/branch context. The same code supports a second independently configured business.

Confirmed inputs: [project scope](../../../../../../../../docs/project-scope.md) establishes Business → Branch ownership, one operational branch initially and configurable business identity. The user approved local API, local PostgreSQL, locally served client assets and one maintained codebase on 2026-10-12; [topology record](../../../../../../../../docs/architecture/vendor-isolation-proposal.md) owns that decision. Controlled provisioning/configuration was approved for BA-01; BA-02 subsequently implemented HTTP context/access. On 2026-10-17 the user explicitly deferred actual two-database execution to future installation/provisioning validation while retaining focused API isolation, branch-permission and fail-closed acceptance; [decision and evidence assessment](../../../../../../../../docs/planning/business-access/phase-tracker.md#ba-03-revised-acceptance-scope--2026-10-17).

## Proposed P0 requirements

Rows describe product P0 for the first integrated milestone. BA-01/BA-02 implement these capabilities; the revised acceptance examples below define BA-03 verification without expanding execution authorization.

| ID | Requirement | Why needed / simpler alternative |
| --- | --- | --- |
| BB-R01 | Persist one Business and an explicitly selected initial Branch with durable identities and ownership | Hardcoded identities prevent reuse; implicit first-branch selection can misroute future data. One installation boundary avoids shared tenant routing. |
| BB-R02 | Validate required business name, currency, timezone and branch name; retain optional address as branch information | Staff and future monetary/time workflows need valid configuration. Start with text identity, an ISO currency code and IANA timezone; no branding upload or configuration engine. |
| BB-R03 | Controlled, atomic initial provisioning together with an administrator | A partially initialized installation cannot support safe login. Use an operator command, not public signup or manual SQL. |
| BB-R04 | Resolve installation context server-side and expose it only after access validation | Separate databases alone do not validate branch access. No client-selectable database or business switch. |

## Rules and ownership

- Business owns business/branch records and the singleton installation binding. Branch references its business; the model permits future branches, but this increment provides no branch creation/switching UI or API.
- Required fields: Business `{id, name, currencyCode, timezone}`; Branch `{id, businessId, name, address?}`. IDs are opaque server-generated values. Reject blank names, unknown currency/timezone and unknown input fields; trim names to 1–120 Unicode code points and supplied address to 1–500, rejecting control characters and unknown fields. Currency codes are validated against Node ICU supported uppercase codes; timezone names/aliases are validated and canonicalized with Intl, excluding numeric offsets. [Runtime validator](../../../application/business-configuration.ts) is the operator input contract, not an HTTP schema.
- One installation binding identifies its business and initial branch explicitly. Context resolution fails closed for business operations if the binding is missing, ambiguous or refers to a branch of another business. Technical health retains its existing meaning.
- Initial business configuration is supplied through controlled provisioning. Currency/timezone and identity edits are outside this increment; no permanent immutability requirement is implied. Fiscal settings await their affected specification; no default tax status, rate or compliance claim is inferred from PKR or location.
- Authentication owns staff, credentials, memberships, branch grants and sessions. It calls a narrow Business public capability to validate installation/branch identity; Business never imports authentication persistence.
- A bootstrap application operation coordinates both module public provisioning capabilities in one PostgreSQL transaction using one transaction context. Each module retains its table writes; no module imports another's Drizzle schema. Place this integration operation at the composition boundary, avoiding circular module imports or a generic transaction framework. Rollback all business/staff/binding writes on failure; serialize bootstrap with a database lock/constraint so concurrent attempts cannot create two installations. Migrations remain a separate explicit operator step.
- Business and Authentication exchange an opaque transaction context; only their private persistence adapters resolve it to the shared Drizzle transaction. Context expires after the transaction callback. Business/Branch binding ownership has composite database constraints. Cross-module staff business/branch references are validated through Business’s public operation in the same transaction, without foreign schema imports; only Authentication-owned account/credential/grant relations have its foreign keys. No delete workflow exists; future deletion must explicitly preserve these references.
- No business, branch, staff or session selector changes the configured database connection. Runtime credentials and backup targets belong to this installation; production database roles must not gain access to other businesses' databases.

## Proposed interfaces and failures

BA-01 operator/internal contracts passed staging acceptance. BA-02 implements authenticated context under `/api/v1`; the Authentication specification links executable route/input contracts. Route suffixes below omit that prefix. Verification status and limits belong to the joint tracker.

| Interface | Inputs | Success / constraints |
| --- | --- | --- |
| Operator `provision-installation` | Business configuration, initial branch, initial administrator username and securely entered password | Return business/branch/account IDs, never credentials. Only when uninitialized; repeat returns conflict without overwriting. Invalid configuration or partial failure writes nothing. |
| Business public `resolveInstallationContext` | Server configuration/binding | Explicit business/branch IDs and validated display configuration; never a query builder or connection selector. |
| Business public `validateBranchOwnership` | Internal business/branch IDs | Validated ownership or denial; no foreign-data payload. |
| Authenticated `GET /context` | Session; no arbitrary business selector | Authorized account/role, business display configuration and permitted initial branch ID. No credentials, session internals or fiscal assumptions. |

Proposed errors: 400 invalid boundary input; 401 absent/invalid session; 403 valid staff without branch permission; 404 inaccessible referenced resources without foreign metadata; 409 duplicate provisioning; 503 unavailable persistence/context. Internal errors remain generic. Operator failures exit nonzero and log no secrets. No unauthenticated business configuration endpoint. Context response is composed by Authentication/Access after authorization, using Business's public capability.

## Acceptance examples

### BB-AC01 — Explicit ownership and configuration

Provision arbitrary restaurant A with one branch, a supported currency/timezone and a non-Chickano name. Read back exact configured identity and explicit ownership; no hardcoded IDs or first-row selection. Invalid or blank configuration produces no partial records. Required evidence: focused validation/persistence checks and user-run provision/read behavior after separate execution authorization.

### BB-AC02 — Atomic and repeatable provisioning

Provision A with an administrator, then repeat and attempt concurrent initialization. Exactly one complete installation exists; duplicates are rejected. Induce failure while creating the administrator: neither business binding nor staff remains from the failed attempt. Correct and retry successfully. First real migration must also be reviewed/applied to a disposable target, rerun without duplicate application and checked for risk-appropriate recovery. Evidence: separately authorized integration/database behavior; generated SQL/source review alone is insufficient.

### BB-AC03 — Independent installations

Each installation uses its server-configured database connection; request-supplied business/account/branch IDs must not select another connection or expose another business's records. For BA-03 development acceptance, review fixed connection configuration and server-bound context/scoped lookup paths, reuse focused service checks for foreign identities/session-business mismatch, and verify existing authorized context and rejected unsupported identity fields on the disposable test target. Distinguish source/double evidence from database-backed observations; no claim of two-installation runtime acceptance follows.

Actual same-release provisioning of A/B on two independently configured databases, reciprocal cookie/ID checks and operational credential/target separation are **deferred, unrun**, for future installation/provisioning validation under separate authorization. They do not block the revised BA-03 development exit. Configuration, reports/jobs when introduced, backups and restores must preserve the isolation boundary; future-module and backup/restore claims retain their own release evidence.

### BB-AC04 — Fail closed on invalid context

With missing or inconsistent binding, reject business operations without guessing a branch. A permitted staff session reads its initial branch; an unauthorized branch reference is denied. Database failure returns a sanitized unavailable response, with no successful business response based on stale guessed context. Evidence: focused fault/context checks; deployment recovery remains separate.

## Deferred and open

P1: branding uploads, self-service setup and configuration editor; basic configured identity suffices for this milestone. Future requirements outside this phase: multiple-branch operation, transfers, consolidation and synchronization. Menu, tax computation, billing and frontend remain outside this specification.

Review BA-D01 and BA-D05 in the [joint tracker](../../../../../../../../docs/planning/business-access/phase-tracker.md#review-decisions). Personal data is minimized to business contact/address when supplied; access and protected backups follow [compliance policy](../../../../../../../../docs/compliance/README.md). Retention and operational custody remain release decisions, not invented legal periods.
