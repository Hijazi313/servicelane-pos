import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ConnectionOptions } from 'node:tls';
import type { PoolConfig } from 'pg';

export class ConfigurationError extends Error {}

export interface Configuration {
  host: string;
  port: number;
  environment: string;
  database: PoolConfig;
  migrationDatabase: PoolConfig;
}

function databaseUrl(value: string | undefined, field: string): string {
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname || !url.username || !url.password ||
        url.pathname.length < 2 || url.search || url.hash) throw new Error();
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    decodeURIComponent(url.pathname);
    return value;
  } catch {
    throw new ConfigurationError(`${field} must be a PostgreSQL URL with credentials and database name, without query parameters`);
  }
}

export function readConfiguration(env: NodeJS.ProcessEnv): Configuration {
  const host = env.HOST ?? '127.0.0.1';
  if (!host.trim() || /[\s/]/.test(host)) throw new ConfigurationError('HOST must be a hostname or IP address');
  const portValue = env.PORT ?? '3000';
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigurationError('PORT must be an integer between 1 and 65535');
  }
  const environment = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(environment)) {
    throw new ConfigurationError('NODE_ENV must be development, test or production');
  }
  const connectionString = databaseUrl(env.DATABASE_URL, 'DATABASE_URL');
  const migrationUrl = env.MIGRATION_DATABASE_URL === undefined
    ? connectionString : databaseUrl(env.MIGRATION_DATABASE_URL, 'MIGRATION_DATABASE_URL');
  const tlsVerify = env.DATABASE_TLS_VERIFY ?? 'true';
  if (tlsVerify !== 'true' && tlsVerify !== 'false') {
    throw new ConfigurationError('DATABASE_TLS_VERIFY must be true or false');
  }
  const ssl: ConnectionOptions = { rejectUnauthorized: tlsVerify === 'true' };
  if (env.DATABASE_CA_FILE !== undefined) {
    try {
      if (!env.DATABASE_CA_FILE.trim()) throw new Error();
      ssl.ca = readFileSync(resolve(import.meta.dirname, '../../../..', env.DATABASE_CA_FILE), 'utf8');
      if (!ssl.ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error();
    } catch {
      throw new ConfigurationError('DATABASE_CA_FILE must point to a readable PEM CA certificate');
    }
  }
  return {
    host, port, environment,
    database: { connectionString, ssl, application_name: 'servicelane-api', max: 5, connectionTimeoutMillis: 2500, idleTimeoutMillis: 10000 },
    migrationDatabase: { connectionString: migrationUrl, ssl, application_name: 'servicelane-migrations', connectionTimeoutMillis: 10000 },
  };
}
