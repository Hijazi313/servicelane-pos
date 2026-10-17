import 'reflect-metadata';
import { userInfo } from 'node:os';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ConfigurationError, readConfiguration } from '../infrastructure/configuration.js';
import { AuthenticationModule, AccessService } from '../modules/authentication/public.js';
import { AccessError, uuid, password } from '../modules/authentication/application/access-policy.js';
import { readHiddenPassword } from './hidden-password.js';

async function run(): Promise<void> {
  if (process.argv.length !== 4) throw new AccessError(400, 'Usage: recover-administrator <business-uuid> <account-uuid>');
  const businessId = uuid(process.argv[2]); const accountId = uuid(process.argv[3]);
  const configuration = readConfiguration(process.env);
  // OS process identity is attributable evidence, not proof of authorized host custody.
  const operator = userInfo(); const operatorIdentity = `uid:${operator.uid};user:${operator.username}`;
  let replacement = await readHiddenPassword(process.stdin, process.stderr, 'Replacement administrator password: ');
  let confirmation = '';
  try {
    confirmation = await readHiddenPassword(process.stdin, process.stderr, 'Confirm password: ');
    if (replacement !== confirmation) throw new AccessError(400, 'Passwords do not match');
    password(replacement);
    @Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => configuration] }), AuthenticationModule] })
    class RecoveryOperatorModule {}
    const app = await NestFactory.createApplicationContext(RecoveryOperatorModule, { logger: false, abortOnError: false });
    try {
      await app.get(AccessService).recover(businessId, accountId, replacement, operatorIdentity);
      console.log(JSON.stringify({ accountId, recovered: true }));
    } finally { await app.close(); }
  } finally { replacement = ''; confirmation = ''; }
}
run().catch((error: unknown) => {
  console.error(error instanceof AccessError || error instanceof ConfigurationError ? error.message : 'Recovery failed; verify terminal, input, database access, migration state and TLS');
  process.exitCode = 1;
});
