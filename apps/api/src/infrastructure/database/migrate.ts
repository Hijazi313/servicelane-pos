import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { ConfigurationError, readConfiguration } from '../configuration.js';

async function runMigrations(): Promise<void> {
  const migrationsFolder = resolve(import.meta.dirname, '../../../migrations');
  const files = await readdir(migrationsFolder);
  // The foundation ships no schema. Do not create database history for an empty set.
  if (files.every((file) => file === 'README.md')) {
    console.log('No generated migrations to apply');
    return;
  }
  const options = { migrationsFolder };
  // Validate generated artifacts before opening a connection.
  if (readMigrationFiles(options).length === 0) {
    console.log('No generated migrations to apply');
    return;
  }
  const config = readConfiguration(process.env);
  const pool = new Pool({ ...config.migrationDatabase, max: 1 });
  pool.on('error', () => console.error('An idle migration connection failed'));
  try {
    await migrate(drizzle({ client: pool }), options);
    console.log('Migrations complete');
  } finally {
    await pool.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error(error instanceof ConfigurationError ? error.message : 'Migration failed; inspect database access, TLS, permissions and migration files');
  process.exitCode = 1;
});
