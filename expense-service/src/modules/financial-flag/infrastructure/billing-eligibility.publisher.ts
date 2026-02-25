import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TenantContext } from '@tripaxis/core';

@Injectable()
export class BillingEligibilityPublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  publishEligible(claimId: string, tenantId: string): void {
    this.client.emit('ExpenseBillableEligible', {
      claimId,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }

  publishInvoiceGenerated(claimId: string, tenantId: string): void {
    this.client.emit('InvoiceGenerated', {
      claimId,
      tenantId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }

  publishInvoiceConfirmed(claimId: string, tenantId: string, invoiceReferenceId: string): void {
    this.client.emit('InvoiceConfirmed', {
      claimId,
      tenantId,
      invoiceReferenceId,
      correlationId: TenantContext.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }
}
