import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditTrailWriter } from '../infrastructure/audit-trail.writer';

@Injectable()
export class PayableOverrideHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditWriter: AuditTrailWriter,
  ) {}

  async overridePayable(
    tenantId: string,
    claimId: string,
    lineItemId: string,
    reviewerId: string,
    newPayable: boolean,
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

    if (lineItem.isPayable === newPayable) return;

    await db.expenseClaimLineItem.update({
      where: { id: lineItemId },
      data: { isPayable: newPayable }
    });

    await db.expenseClaim.update({
      where: { id: claimId },
      data: { payableOverrideReason: reason }
    });

    // BR-015: Payable override logged immutably
    await this.auditWriter.logOverride(
      tenantId,
      claimId,
      reviewerId,
      {
        lineItemId,
        previousPayable: lineItem.isPayable,
        newPayable,
        remarks: `Payable flag overridden: ${reason}`
      },
      db
    );
  }
}
