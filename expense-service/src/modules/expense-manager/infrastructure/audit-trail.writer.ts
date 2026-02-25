import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface OverrideAuditPayload {
  lineItemId?: string;
  previousPayable?: boolean;
  newPayable?: boolean;
  previousBillable?: boolean;
  newBillable?: boolean;
  remarks: string;
}

@Injectable()
export class AuditTrailWriter {
  constructor(private readonly prisma: PrismaService) {}

  async logOverride(
    tenantId: string,
    claimId: string,
    reviewerId: string,
    payload: OverrideAuditPayload,
    tx?: any
  ): Promise<void> {
    const db = tx || this.prisma;
    
    // Append-only audit log
    await db.expenseManagerAudit.create({
      data: {
        tenantId,
        claimId,
        reviewerId,
        lineItemId: payload.lineItemId,
        previousPayable: payload.previousPayable,
        newPayable: payload.newPayable,
        previousBillable: payload.previousBillable,
        newBillable: payload.newBillable,
        remarks: payload.remarks,
      }
    });
  }
}
