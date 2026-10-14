import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/public.js';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { AdministratorProvisioner } from './infrastructure/administrator-provisioner.service.js';
import { AccessStore } from './application/access-store.js';
import { PostgresAccessStore } from './infrastructure/access-store.js';
import { PasswordHasher } from './application/access-policy.js';
import { NodePasswordHasher } from './infrastructure/password-hasher.js';
import { AccessService } from './application/access.service.js';

@Module({ imports: [BusinessModule, DatabaseModule], providers: [AdministratorProvisioner, AccessService,
  { provide: AccessStore, useClass: PostgresAccessStore }, { provide: PasswordHasher, useClass: NodePasswordHasher }],
  exports: [AdministratorProvisioner, AccessService] })
export class AuthenticationModule {}
