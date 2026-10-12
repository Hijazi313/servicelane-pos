import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/public.js';
import { AdministratorProvisioner } from './infrastructure/administrator-provisioner.service.js';

@Module({ imports: [BusinessModule], providers: [AdministratorProvisioner], exports: [AdministratorProvisioner] })
export class AuthenticationModule {}
