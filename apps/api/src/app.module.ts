import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { readConfiguration } from './infrastructure/configuration.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { HealthController } from './infrastructure/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => readConfiguration(process.env)] }),
    DatabaseModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
