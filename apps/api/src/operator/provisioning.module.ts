import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module.js';
import { BusinessModule } from '../modules/business/public.js';
import { AuthenticationModule } from '../modules/authentication/public.js';
import { ProvisionInstallation } from '../application/provision-installation.js';

// Dedicated operator composition: never imported by the HTTP AppModule.
@Module({ imports: [DatabaseModule, BusinessModule, AuthenticationModule], providers: [ProvisionInstallation], exports: [ProvisionInstallation] })
export class ProvisioningModule {}
