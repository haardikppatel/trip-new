import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TravelController } from './presentation/travel.controller';
import { TravelService } from './application/travel.service';
import { PolicyGrpcClient } from './infrastructure/policy-grpc.client';
import { TravelGateway } from './infrastructure/travel.gateway';
import { SlaProcessor } from './infrastructure/sla.processor';
import { AuditLogger, StructuredLogger } from '@tripaxis/core';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'travel-sla',
    }),
  ],
  controllers: [TravelController],
  providers: [
    TravelService,
    PolicyGrpcClient,
    TravelGateway,
    SlaProcessor,
    AuditLogger,
    StructuredLogger,
  ],
})
export class TravelModule {}
