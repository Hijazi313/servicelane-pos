import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolClient, type PoolConfig } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly pool: Pool;
  readonly db: NodePgDatabase;

  constructor(config: ConfigService) {
    this.pool = new Pool(config.getOrThrow<PoolConfig>('database'));
    this.db = drizzle({ client: this.pool });
    this.pool.on('error', () => this.logger.warn('An idle database connection failed'));
  }

  async isReachable(): Promise<boolean> {
    let client: PoolClient | undefined;
    let expired = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = (destroy: boolean) => {
      const held = client;
      client = undefined;
      held?.release(destroy);
    };
    const operation = (async () => {
      const acquired = await this.pool.connect();
      if (expired) {
        acquired.release(true);
        return false;
      }
      client = acquired;
      await drizzle({ client: acquired }).execute(sql`SELECT 1`);
      return true;
    })();
    const deadline = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => {
        expired = true;
        release(true);
        resolve(false);
      }, 3000);
    });
    try {
      return await Promise.race([operation, deadline]);
    } catch {
      release(true);
      return false;
    } finally {
      clearTimeout(timer);
      release(false);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
