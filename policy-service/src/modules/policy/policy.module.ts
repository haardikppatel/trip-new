import { Module } from '@nestjs/common';
import { PolicyController } from './presentation/policy.controller';
import { PolicyService } from './application/policy.service';
import { StructuredLogger } from '@tripaxis/core';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService, StructuredLogger],
})
export class PolicyModule {}
