import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpenseManagerEventPublisher } from '../infrastructure/expense-manager-event.publisher';
import { SLASecondLevelEngine } from './sla-second-level.engine';
import { AuditTrailWriter } from '../infrastructure/audit-trail.writer';

@Injectable()
export class ApprovalFinalizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: ExpenseManagerEventPublisher,
    private readonly slaEngine: SLASecondLevelEngine,
    private readonly auditWriter: AuditTrailWriter,
  ) {}

  async finalizeApproval(
    tenantId: string,
    claimId: string,
    reviewerId: string,
    complianceNotes?: string,
    tx?: any
  ): Promise<void> {
    const db = tx || this.prisma;

    const claim = await db.expenseClaim.update({
      where: { id: claimId },
      data: {
        status: 'FINAL_APPROVED',
        locked: true, // BR-017: Final decisions immutable
        finalDecisionAt: new Date(),
        complianceNotes,
      }
    });

    await this.auditWriter.logOverride(tenantId, claimId, reviewerId, {
      remarks: `Claim Final Approved. Notes: ${complianceNotes || 'None'}`
    }, db);

    await this.slaEngine.cancelSLA(claimId);
    this.eventPublisher.publishFinalApproved(claimId, tenantId, Number(claim.totalAmountBase));
  }

  async finalizeRejection(
    tenantId: string,
    claimId: string,
    reviewerId: string,
    reason: string,
    tx?: any
  ): Promise<void> {
    if (!reason || reason.length < 10) {
      throw new BadRequestException('BR-019: Rejection reason must be at least 10 characters');
    }

    const db = tx || this.prisma;

    await db.expenseClaim.update({
      where: { id: claimId },
      data: {
        status: 'FINAL_REJECTED',
        locked: true, // BR-017: Final decisions immutable
        finalDecisionAt: new Date(),
        complianceNotes: reason,
      }
    });

    await this.auditWriter.logOverride(tenantId, claimId, reviewerId, {
      remarks: `Claim Final Rejected. Reason: ${reason}`
    }, db);

    await this.slaEngine.cancelSLA(claimId);
    this.eventPublisher.publishFinalRejected(claimId, tenantId, reason);
  }
}
