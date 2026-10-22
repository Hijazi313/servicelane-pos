# Database migrations

Drizzle Kit generates SQL and metadata from `src/infrastructure/database/schema.ts`. That entry point re-exports module-owned schema declarations. BA-01 adds the offline `0000_business_bootstrap.sql` and metadata for Business/Branch/binding and administrator accounts/credentials/grants. It was applied and rerun successfully on user-authorized staging during BA-01 acceptance, including additive-DDL rollback recovery. Other targets require explicit authorization; no automatic application at startup. API startup never applies migrations.

From repository root:

```sh
pnpm db:generate
# Review generated SQL and metadata; commit both.
pnpm build
pnpm db:migrate
```

Generation is offline and requires no credentials. Apply uses the shared validated PostgreSQL/TLS configuration and optional `MIGRATION_DATABASE_URL`. Confirm the target before applying. An empty migration set exits without connecting. Drizzle owns `drizzle.__drizzle_migrations`; keep generated SQL, snapshots and `meta/_journal.json` together. Do not hand-edit the journal or mutate applied migrations. Never put backups here.

Run only one migrator at a time; this workflow does not provide the previous runner's advisory locking. Pending SQL and history entries use Drizzle's transaction; initial history schema/table creation occurs before it and may remain after failure. nontransactional DDL requires a separate design. Recover with a reviewed forward corrective migration, rather than a down command. Do not use schema push against shared databases.

If node-pg-migrate was used against an existing database, stop and plan an explicit baseline/history transition first. Drizzle does not import `pgmigrations` history automatically. No such database has been inspected by this project.

See the [acceptance record](../../../docs/acceptance/project-foundation.md). No-op execution alone is not evidence of database migration success.

## BA-02 source-only migration

`0001_staff_access.sql` adds four Authentication-owned tables: sessions, pre-login CSRF state, throttle counters and security events, plus their checks/indexes and account-ownership FK. Existing six BA-01 tables are unchanged. Generated offline with metadata; source review does not prove application, locking, cleanup or recovery. Do not run `db:migrate` under BA-02 source-only authorization. Accepted BA-01 history is preserved; its staging harness expects the earlier six-table state and is not a BA-02 acceptance runner.

`0002_login_reservations.sql` is the forward source correction for pending login attempts. It adds a default-empty UUID array bounded to five entries (and no more than charged attempts), restricted to account counters. It preserves prior tables/columns and attempts; no applied migration is rewritten. Review/apply this and pending `0001` only after separate BA-02 database authorization. No migration was applied during the source correction.

## KT-01 source-only migration

`0005_kitchen_handoff.sql` adds Kitchen-owned preparation tickets, scoped order identity/dispatch positions and state/revision/provenance constraints. Generated offline with metadata; not applied. Source/offline checks cannot prove real uniqueness/locking/rollback/sequence visibility or restart readback. No change to earlier applied migrations. [Owning authorization/evidence](../src/modules/kitchen/docs/features/preparation/phase-tracker.md).
