import { MenuOrderResolver } from './application/menu-order-resolver.service.js';
import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../authentication/public.js';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { MenuService } from './application/menu.service.js';
import { MenuStore } from './application/menu-store.js';
import { PostgresMenuStore } from './infrastructure/menu-store.js';
import { MenuController } from './http/menu.controller.js';
@Module({ imports: [AuthenticationModule, DatabaseModule], controllers: [MenuController], exports: [MenuOrderResolver], providers: [MenuOrderResolver, MenuService, { provide: MenuStore, useClass: PostgresMenuStore }] })
export class MenuModule {}
