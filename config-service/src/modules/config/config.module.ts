import { Module } from '@nestjs/common';
import { ConfigController } from './presentation/config.controller';
import { ConfigManagementService } from './application/config-management.service';
import { ConfigActivationService } from './application/config-activation.service';
import { ConfigValidationEngine } from './domain/config-validation.engine';
import { ConfigAuditWriter } from './infrastructure/config-audit.writer';
import { ConfigCacheService } from './infrastructure/config-cache.service';
import { ConfigEventPublisher } from './infrastructure/config-event.publisher';
import { Redis } from 'ioredis';

@Module({
  controllers: [ConfigController],
  providers: [
    ConfigManagementService,
    ConfigActivationService,
    ConfigValidationEngine,
    ConfigAuditWriter,
    ConfigCacheService,
    ConfigEventPublisher,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
    },
  ],
})
export class ConfigModule {}
