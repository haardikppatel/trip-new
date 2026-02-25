import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplianceValidationEngine } from '../domain/compliance-validation.engine';
import { PayableOverrideHandler } from '../domain/payable-override.handler';
import { BillableFlagEditor } from '../domain/billable-flag.editor';
import { ApprovalFinalizationService } from './approval-finalization.service';
import { FinalApproveDto, FinalRejectDto, OverrideFlagDto } from '../dto/expense-manager.dto';
import { TenantContext } from '@tripaxis/core';

@Injectable()
export class ExpenseManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly complianceEngine: ComplianceValidationEngine,
    private readonly payableHandler: PayableOverrideHandler,
    private readonly billableEditor: BillableFlagEditor,
    private readonly finalizationService: ApprovalFinalizationService,
  ) {}

  async getPendingReviews() {
    const context = TenantContext.getOrThrow();
    // BR-014: Only ManagerApproved claims visible
    return this.prisma.expenseClaim.findMany({
      where: {
        tenantId: context.tenantId,
        status: 'MANAGER_APPROVED',
        locked: false,
      },
      include: { lineItems: true }
    });
  }

  async approveClaim(claimId: string, dto: FinalApproveDto) {
    const context = TenantContext.getOrThrow();

    return this.prisma.$transaction(async (tx) => {
      await this.complianceEngine.validateForFinalApproval(claimId, context.tenantId, dto.justification);
      
      await this.finalizationService.finalizeApproval(
        context.tenantId,
        claimId,
        context.userId,
        dto.complianceNotes,
        tx
      );

      return { success: true, status: 'FINAL_APPROVED' };
    });
  }

  async rejectClaim(claimId: string, dto: FinalRejectDto) {
    const context = TenantContext.getOrThrow();

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.expenseClaim.findUnique({ where: { id: claimId } });
      if (!claim || claim.tenantId !== context.tenantId) throw new BadRequestException('Claim not found');
      if (claim.locked) throw new BadRequestException('BR-017: Claim is locked');

      await this.finalizationService.finalizeRejection(
        context.tenantId,
        claimId,
        context.userId,
        dto.reason,
        tx
      );

      return { success: true, status: 'FINAL_REJECTED' };
    });
  }

  async overridePayable(claimId: string, lineItemId: string, dto: OverrideFlagDto) {
    const context = TenantContext.getOrThrow();
    return this.prisma.$transaction(async (tx) => {
      await this.payableHandler.overridePayable(
        context.tenantId,
        claimId,
        lineItemId,
        context.userId,
        dto.newValue,
        dto.reason,
        tx
      );
      return { success: true };
    });
  }

  async overrideBillable(claimId: string, lineItemId: string, dto: OverrideFlagDto) {
    const context = TenantContext.getOrThrow();
    return this.prisma.$transaction(async (tx) => {
      await this.billableEditor.overrideBillable(
        context.tenantId,
        claimId,
        lineItemId,
        context.userId,
        dto.newValue,
        dto.reason,
        tx
      );
      return { success: true };
    });
  }
}
