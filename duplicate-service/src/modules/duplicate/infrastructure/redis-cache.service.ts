import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async cacheClaim(claim: any): Promise<void> {
    const key = `tenant:${claim.tenantId}:recent_claims`;
    // Store claim in a sorted set by timestamp
    const score = new Date(claim.expenseDate).getTime();
    await this.redis.zadd(key, score, JSON.stringify(claim));
    
    // Keep only last 90 days
    const ninetyDaysAgo = Date.now() - 90 * 24 * 3600 * 1000;
    await this.redis.zremrangebyscore(key, '-inf', ninetyDaysAgo);
  }

  async getRecentClaims(tenantId: string, days: number = 30): Promise<any[]> {
    const key = `tenant:${tenantId}:recent_claims`;
    const since = Date.now() - days * 24 * 3600 * 1000;
    const results = await this.redis.zrangebyscore(key, since, '+inf');
    return results.map((res) => JSON.parse(res));
  }
}
