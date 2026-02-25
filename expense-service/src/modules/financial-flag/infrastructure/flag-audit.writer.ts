import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayableStatus, BillableStatus } from '@prisma/client';

@Injectable()
export class FlagAuditWriter {
  constructor(private readonly prisma: PrismaService) {}

  async logTransition(
    tenantId: string,
    claimId: string,
    triggeredByUserId: string,
    reason: string,
    oldPayable?: PayableStatus,
    newPayable?: PayableStatus,
    oldBillable?: BillableStatus,
    newBillable?: BillableStatus,
    tx?: any
  ): Promise<void> {
    const db = tx || this.prisma;

    // BR-027: Every transition must produce audit record (Append-only)
    await db.financialFlagAudit.create({
      data: {
        tenantId,
        claimId,
        triggeredByUserId,
        transitionReason: reason,
        oldPayableStatus: oldPayable,
        newPayableStatus: newPayable,
        oldBillableStatus: oldBillable,
        newBillableStatus: newBillable,
      }
    });
  }
}
