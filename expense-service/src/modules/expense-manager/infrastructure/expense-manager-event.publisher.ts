import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ExpenseManagerEventPublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  publishFinalApproved(claimId: string, tenantId: string, amount: number): void {
    this.client.emit('ExpenseFinalApproved', {
      claimId,
      tenantId,
      amount,
      paymentEligibility: true,
      timestamp: new Date().toISOString()
    });
  }

  publishFinalRejected(claimId: string, tenantId: string, reason: string): void {
    this.client.emit('ExpenseFinalRejected', {
      claimId,
      tenantId,
      reason,
      timestamp: new Date().toISOString()
    });
  }
}
