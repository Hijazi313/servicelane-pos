import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ConfigurationError, readConfiguration } from '../infrastructure/configuration.js';
import { ProvisionInstallation, validateProvisioningInput } from '../application/provision-installation.js';
import { BusinessValidationError, InstallationConflictError } from '../modules/business/public.js';
import { AdministratorValidationError } from '../modules/authentication/public.js';
import { ProvisioningModule } from './provisioning.module.js';
import { readHiddenPassword } from './hidden-password.js';

class OperatorInputError extends Error {}

async function run(): Promise<void> {
  if (process.argv.length !== 3 || !process.argv[2] || process.argv[2].startsWith('-')) {
    throw new OperatorInputError('Usage: provision-installation <non-secret-configuration.json>');
  }
  // Never accept passwords in argv, environment, JSON or a redirected stream.
  const input = validateProvisioningInput(JSON.parse(await readFile(process.argv[2], 'utf8')));
  const configuration = readConfiguration(process.env);
  let password = await readHiddenPassword(process.stdin, process.stderr, 'Initial administrator password: ');
  let confirmation = await readHiddenPassword(process.stdin, process.stderr, 'Confirm password: ');
  try {
    if (password !== confirmation) throw new AdministratorValidationError('Passwords do not match');
    @Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => configuration] }), ProvisioningModule] })
    class OperatorModule {}
    const app = await NestFactory.createApplicationContext(OperatorModule, { logger: false, abortOnError: false });
    try {
      const result = await app.get(ProvisionInstallation).execute(input, password);
      console.log(JSON.stringify(result));
    } finally {
      await app.close();
    }
  } finally {
    // JS strings cannot be reliably zeroized; drop references promptly.
    password = '';
    confirmation = '';
  }
}

run().catch((error: unknown) => {
  const safe = error instanceof OperatorInputError || error instanceof ConfigurationError || error instanceof BusinessValidationError ||
    error instanceof AdministratorValidationError || error instanceof InstallationConflictError;
  console.error(safe ? error.message : 'Provisioning failed; verify input, terminal, database access, migration state and TLS');
  process.exitCode = 1;
});
