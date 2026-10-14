import { Controller, Get, SetMetadata, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @SetMetadata('access-entry', 'health')
  async health(): Promise<{ status: 'ok' }> {
    if (!await this.database.isReachable()) {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    return { status: 'ok' };
  }
}
