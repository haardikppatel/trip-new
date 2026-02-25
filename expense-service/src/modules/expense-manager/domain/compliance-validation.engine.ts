import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComplianceValidationEngine {
  constructor(private readonly prisma: PrismaService) {}

  async validateForFinalApproval(claimId: string, tenantId: string, justification?: string): Promise<void> {
    const claim = await this.prisma.expenseClaim.findUnique({
      where: { id: claimId },
      include: { lineItems: true },
    });

    if (!claim || claim.tenantId !== tenantId) {
      throw new BadRequestException('Claim not found');
    }

    // BR-014: Only ManagerApproved claims visible/actionable
    if (claim.status !== 'MANAGER_APPROVED') {
      throw new BadRequestException('BR-014: Claim must be in MANAGER_APPROVED status');
    }

    // BR-017: Final decisions immutable
    if (claim.locked) {
      throw new BadRequestException('BR-017: Claim is locked and cannot be modified');
    }

    // BR-016: Duplicate claims require justification
    if (claim.duplicateDetected && !justification) {
      throw new BadRequestException('BR-016: Duplicate detected. Justification is required for approval.');
    }

    // BR-018: FX rate cannot change after submission (Integrity check)
    // In a real scenario, compare with a snapshot or historical FX table.
    // For this implementation, we ensure the line items' amountBase matches amount * fxRate
    for (const item of claim.lineItems) {
      const expectedBase = Number(item.amount) * Number(item.fxRate);
      if (Math.abs(Number(item.amountBase) - expectedBase) > 0.01) {
        throw new BadRequestException(`BR-018: FX integrity validation failed for line item ${item.id}`);
      }
    }
  }
}
