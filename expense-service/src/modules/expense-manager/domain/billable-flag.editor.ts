import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditTrailWriter } from '../infrastructure/audit-trail.writer';

@Injectable()
export class BillableFlagEditor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditWriter: AuditTrailWriter,
  ) {}

  async overrideBillable(
    tenantId: string,
    claimId: string,
    lineItemId: string,
    reviewerId: string,
    newBillable: boolean,
    reason: string,
    tx: any
  ): Promise<void> {
    const db = tx || this.prisma;
    
    const lineItem = await db.expenseClaimLineItem.findUnique({
      where: { id: lineItemId },
      include: { claim: true }
    });

    if (!lineItem || lineItem.tenantId !== tenantId || lineItem.claimId !== claimId) {
      throw new BadRequestException('Line item not found');
    }

    if (lineItem.claim.locked) {
      throw new BadRequestException('BR-017: Cannot override flags on a locked claim');
    }

    if (lineItem.isBillable === newBillable) return;

    await db.expenseClaimLineItem.update({
      where: { id: lineItemId },
      data: { isBillable: newBillable }
    });

    await db.expenseClaim.update({
      where: { id: claimId },
      data: { billableOverrideReason: reason }
    });

    await this.auditWriter.logOverride(
      tenantId,
      claimId,
      reviewerId,
      {
        lineItemId,
        previousBillable: lineItem.isBillable,
        newBillable,
        remarks: `Billable flag overridden: ${reason}`
      },
      db
    );
  }
}
