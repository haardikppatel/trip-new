import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TenantContext } from '@tripaxis/core';

@Injectable()
export class PaymentEventPublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  publishPaymentStarted(claimId: string, runId: string, tenantId: string): void {
    this.client.emit('ExpensePaymentStarted', {
      claimId,
      runId,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }

  publishPaymentCompleted(claimId: string, externalTransactionId: string, amount: number, currency: string, tenantId: string): void {
    this.client.emit('ExpensePaymentCompleted', {
      claimId,
      externalTransactionId,
      amount,
      currency,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }

  publishPaymentFailed(claimId: string, failureReason: string, tenantId: string): void {
    this.client.emit('ExpensePaymentFailed', {
      claimId,
      failureReason,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }
}
