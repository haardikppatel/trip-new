import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class ConfigCacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private getKey(tenantId: string): string {
    return `config:active:${tenantId}`;
  }

  async getActiveConfig(tenantId: string): Promise<any | null> {
    const cached = await this.redis.get(this.getKey(tenantId));
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setActiveConfig(tenantId: string, config: any): Promise<void> {
    // Cache for 24 hours, will be invalidated on new activation
    await this.redis.set(this.getKey(tenantId), JSON.stringify(config), 'EX', 86400);
  }

  async invalidateConfig(tenantId: string): Promise<void> {
    await this.redis.del(this.getKey(tenantId));
  }
}
