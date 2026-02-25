import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DuplicatePublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  publishEvaluationCompleted(payload: {
    claimId: string;
    tenantId: string;
    riskScore: number;
    duplicateDetected: boolean;
    triggeredRules: any[];
    correlationId: string;
  }): void {
    this.client.emit('DuplicateEvaluationCompleted', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
