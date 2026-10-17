import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { BusinessService } from './infrastructure/business.service.js';

@Module({ imports: [DatabaseModule], providers: [BusinessService], exports: [BusinessService] })
export class BusinessModule {}
