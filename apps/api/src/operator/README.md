# Initial installation provisioning

BA-01 delivers a privileged local operator command, not a public HTTP endpoint. It writes business, branch, installation binding, first administrator, credential hash and branch grant atomically. Its transaction acquires a shared advisory lock before testing initialization; repeated/concurrent bootstrap must reject an existing installation without overwriting. All writes use the same checked-out transaction. BA-01 staging acceptance verified actual CLI, PostgreSQL rollback, duplicate/concurrent rejection and corrected retry; see the joint tracker.

## Use after separate database-write authorization

The user separately authorized BA-01 acceptance on empty staging on 2026-10-12; it passed and synthetic records were cleaned. This does not authorize arbitrary targets or later-phase writes.

1. Review the generated `0000_business_bootstrap.sql` and confirm the explicitly authorized disposable/development target. Build and apply migrations only when authorized; startup never applies them.
2. Copy [the non-secret example](provision-installation.example.json) to a protected operator-owned location and edit all identity/settings for the intended business. No password, role, status, IDs, database URL or unknown field belongs in this JSON. Username is case-normalized; display name is optional and defaults to that username. Names/address are trimmed, currency must be an active uppercase code supported by Node ICU, and timezone is canonicalized from supported IANA names/aliases (no numeric offsets). PostgreSQL/database settings come from the same validated ignored `.env` as the API, using runtime `DATABASE_URL`, not a database selected from JSON or a client request.
3. After compiling the current source, run from the repository root:

   ```sh
   pnpm provision-installation /absolute/path/to/installation.json
   ```

4. Enter and confirm a unique 15–128-character password at the hidden terminal prompts. No command-line/environment/file password option or redirected password input is accepted. Backspace removes one Unicode code point; Ctrl-U clears; Ctrl-C/Ctrl-D cancels before a connection is opened. Command success prints only business/branch/account IDs. Failure exits nonzero without SQL, credential or configuration values. Partial business/staff writes roll back together; no automatic retry, migration or overwrite.

The command composes a Nest application context without an HTTP listener or AppModule import, and closes its pool on normal success/failure. Host authorization and operator custody must be established before use. The password-change-required flag is stored; login and enforcement do not exist until BA-02. Administrator recovery is deferred despite approval of its design direction. Do not expose this operator composition through HTTP.

## Non-database checks

`pnpm test:bootstrap` compiles to ignored `apps/api/dist/ba01-check` and uses Node's test runner. It covers validation, real hashing, hidden input and transaction control-flow with doubles; it neither reads `.env` nor opens a database. It does not prove migration application, concurrency serialization, server-side rollback or successful provisioning. [Joint tracker](../../../../docs/planning/business-access/phase-tracker.md) records acceptance evidence and remaining release limits.

The explicit write-based harness is `tests/staging-acceptance.mjs`, separate from `test:bootstrap`. It requires `BA01_ACCEPT_STAGING=YES` and the already-authorized staging settings; never run it against real business data. `BA01_RESUME_ACCEPTANCE=YES` permits replay only when public tables match the six BA-01 tables and records match the synthetic fixture. It applies migrations, temporarily installs a failing credentials trigger, clears synthetic records and retains empty migrated tables. The pseudoterminal driver enters a randomly generated synthetic password without echoing/storing it in evidence.
