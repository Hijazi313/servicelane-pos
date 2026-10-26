import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { DisplaySettingsService } from './application/display-settings.service.js';
import { DisplayStore } from './application/display-store.js';
import { PostgresDisplayStore } from './infrastructure/postgres-display-store.service.js';
import { BusinessService } from './infrastructure/business.service.js';

@Module({ imports: [DatabaseModule], providers: [BusinessService, DisplaySettingsService, { provide: DisplayStore, useClass: PostgresDisplayStore }], exports: [BusinessService, DisplaySettingsService] })
export class BusinessModule {}
