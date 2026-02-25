import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisLockService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, 'LOCKED', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
