import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async health(): Promise<{ status: 'ok' }> {
    if (!await this.database.isReachable()) {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    return { status: 'ok' };
  }
}
