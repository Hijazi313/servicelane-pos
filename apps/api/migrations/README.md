# Database migrations

Drizzle Kit generates SQL and metadata from `src/infrastructure/database/schema.ts`. That entry point re-exports future module-owned schema declarations. No business tables or migrations exist yet. API startup never applies migrations.

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
