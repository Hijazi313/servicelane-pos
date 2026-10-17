import 'reflect-metadata';
import { readAccessHttpConfiguration } from './modules/authentication/http/configuration.js';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigurationError, readConfiguration } from './infrastructure/configuration.js';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  // Validate before loading the Nest module tree; errors must not expose values.
  const config = readConfiguration(process.env);
  const access = readAccessHttpConfiguration(process.env);
  const { AppModule } = await import('./app.module.js');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule, new FastifyAdapter({ logger: false, bodyLimit: 16384, trustProxy: access.trustedProxies.length ? access.trustedProxies : false }), { abortOnError: false },
  );
  app.enableShutdownHooks();
  try {
    await app.listen(config.port, config.host);
    logger.log('API listening');
  } catch {
    await app.close();
    throw new Error('Startup failed');
  }
}

bootstrap().catch((error: unknown) => {
  logger.error(error instanceof ConfigurationError ? error.message : 'API startup failed');
  process.exitCode = 1;
});
