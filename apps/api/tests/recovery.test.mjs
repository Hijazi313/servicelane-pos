import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AuthenticationModule, AccessService } from '../dist/ba02-check/modules/authentication/public.js';
import { DatabaseService } from '../dist/ba02-check/infrastructure/database/database.service.js';
import { readConfiguration } from '../dist/ba02-check/infrastructure/configuration.js';
const env = { ...process.env, DATABASE_URL: 'postgresql://offline:offline@127.0.0.1:1/offline', NODE_ENV: 'test' };

test('recovery command rejects missing/invalid IDs and non-TTY input before connecting', () => {
  for (const args of [[], ['foreign', 'foreign'], ['12345678-1234-4234-8234-123456789abc', '12345678-1234-4234-8234-123456789abd']]) {
    const result = spawnSync(process.execPath, ['dist/ba02-check/operator/recover-administrator.js', ...args], { encoding: 'utf8', env, input: 'a secret is never accepted\n', timeout: 10000 });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.doesNotMatch(result.stderr, /a secret is never accepted|ECONNREFUSED|offline:offline/);
  }
});

test('recovery Nest composition resolves without HTTP or opening a connection', async () => {
  class OfflineRecoveryModule {}
  Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => readConfiguration(env)] }), AuthenticationModule] })(OfflineRecoveryModule);
  const app = await NestFactory.createApplicationContext(OfflineRecoveryModule, { logger: false, abortOnError: false });
  try {
    assert.ok(app.get(AccessService));
    assert.equal(app.get(DatabaseService).pool.totalCount, 0);
  } finally { await app.close(); }
});
