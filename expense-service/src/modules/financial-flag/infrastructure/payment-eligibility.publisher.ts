import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TenantContext } from '@tripaxis/core';

@Injectable()
export class PaymentEligibilityPublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  publishEligible(claimId: string, tenantId: string): void {
    this.client.emit('ExpensePayableEligible', {
      claimId,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }

  publishPaymentStarted(claimId: string, tenantId: string): void {
    this.client.emit('ExpensePaymentStarted', {
      claimId,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }

  publishPaymentCompleted(claimId: string, tenantId: string, paymentReferenceId: string): void {
    this.client.emit('ExpensePaymentCompleted', {
      claimId,
      tenantId,
      paymentReferenceId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }
}
