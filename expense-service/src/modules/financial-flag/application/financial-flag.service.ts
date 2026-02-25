import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayableStateMachine } from '../domain/payable-state-machine';
import { BillableStateMachine } from '../domain/billable-state-machine';
import { FlagTransitionValidator } from '../domain/flag-transition.validator';
import { FlagAuditWriter } from '../infrastructure/flag-audit.writer';
import { PaymentEligibilityPublisher } from '../infrastructure/payment-eligibility.publisher';
import { BillingEligibilityPublisher } from '../infrastructure/billing-eligibility.publisher';
import { PayableSlaScheduler } from './payable-sla.scheduler';
import { UpdatePayableStatusDto, UpdateBillableStatusDto } from '../dto/financial-flag.dto';
import { TenantContext } from '@tripaxis/core';
import { PayableStatus, BillableStatus } from '@prisma/client';

@Injectable()
export class FinancialFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payableStateMachine: PayableStateMachine,
    private readonly billableStateMachine: BillableStateMachine,
    private readonly transitionValidator: FlagTransitionValidator,
    private readonly auditWriter: FlagAuditWriter,
    private readonly paymentPublisher: PaymentEligibilityPublisher,
    private readonly billingPublisher: BillingEligibilityPublisher,
    private readonly slaScheduler: PayableSlaScheduler,
  ) {}

  async updatePayableStatus(claimId: string, dto: UpdatePayableStatusDto) {
    const context = TenantContext.getOrThrow();

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.expenseClaim.findUnique({ where: { id: claimId } });
      if (!claim) throw new BadRequestException('Claim not found');
      
      // BR-026: Cross-tenant transitions forbidden
      if (claim.tenantId !== context.tenantId) {
        throw new BadRequestException('BR-026: Cross-tenant transitions forbidden');
      }

      this.payableStateMachine.validateTransition(claim.payableStatus, dto.status);

      if (dto.status === PayableStatus.ELIGIBLE) {
        this.transitionValidator.validatePayableEligibility(claim, dto.financeOverrideReason);
      } else if (dto.status === PayableStatus.PAID) {
        this.transitionValidator.validatePaidTransition(dto.paymentReferenceId);
      }

      const updated = await tx.expenseClaim.update({
        where: { id: claimId },
        data: {
          payableStatus: dto.status,
          paymentReferenceId: dto.paymentReferenceId || claim.paymentReferenceId,
          lastFlagTransitionAt: new Date(),
        }
      });

      await this.auditWriter.logTransition(
        context.tenantId, claimId, context.userId, dto.reason,
        claim.payableStatus, dto.status, undefined, undefined, tx
      );

      // Side effects
      if (dto.status === PayableStatus.ELIGIBLE) {
        this.paymentPublisher.publishEligible(claimId, context.tenantId);
        await this.slaScheduler.scheduleSlaAlert(claimId, context.tenantId);
      } else if (dto.status === PayableStatus.PAYMENT_IN_PROCESS) {
        this.paymentPublisher.publishPaymentStarted(claimId, context.tenantId);
        await this.slaScheduler.cancelSlaAlert(claimId);
      } else if (dto.status === PayableStatus.PAID) {
        this.paymentPublisher.publishPaymentCompleted(claimId, context.tenantId, dto.paymentReferenceId!);
        await this.slaScheduler.cancelSlaAlert(claimId);
      } else if (dto.status === PayableStatus.CANCELLED) {
        await this.slaScheduler.cancelSlaAlert(claimId);
      }

      return updated;
    });
  }

  async updateBillableStatus(claimId: string, dto: UpdateBillableStatusDto) {
    const context = TenantContext.getOrThrow();

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.expenseClaim.findUnique({ where: { id: claimId } });
      if (!claim) throw new BadRequestException('Claim not found');
      
      if (claim.tenantId !== context.tenantId) {
        throw new BadRequestException('BR-026: Cross-tenant transitions forbidden');
      }

      this.billableStateMachine.validateTransition(claim.billableStatus, dto.status);

      if (dto.status === BillableStatus.INVOICED) {
        this.transitionValidator.validateInvoiceTransition(dto.invoiceReferenceId);
      } else if (dto.status === BillableStatus.WRITTEN_OFF) {
        this.transitionValidator.validateWriteOff(dto.reason);
      }

      const updated = await tx.expenseClaim.update({
        where: { id: claimId },
        data: {
          billableStatus: dto.status,
          invoiceReferenceId: dto.invoiceReferenceId || claim.invoiceReferenceId,
          lastFlagTransitionAt: new Date(),
        }
      });

      await this.auditWriter.logTransition(
        context.tenantId, claimId, context.userId, dto.reason,
        undefined, undefined, claim.billableStatus, dto.status, tx
      );

      // Side effects
      if (dto.status === BillableStatus.BILLABLE) {
        this.billingPublisher.publishEligible(claimId, context.tenantId);
      } else if (dto.status === BillableStatus.INVOICE_GENERATED) {
        this.billingPublisher.publishInvoiceGenerated(claimId, context.tenantId);
      } else if (dto.status === BillableStatus.INVOICED) {
        this.billingPublisher.publishInvoiceConfirmed(claimId, context.tenantId, dto.invoiceReferenceId!);
      }

      return updated;
    });
  }
}
