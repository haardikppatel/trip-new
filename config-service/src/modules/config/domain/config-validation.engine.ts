import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigStatus } from '@prisma/client';

@Injectable()
export class ConfigValidationEngine {
  constructor(private readonly prisma: PrismaService) {}

  async validateDraftModifiable(tenantId: string, versionId: string): Promise<void> {
    const version = await this.prisma.configVersion.findUnique({
      where: { id: versionId }
    });

    if (!version || version.tenantId !== tenantId) {
      throw new BadRequestException('BR-056: Config version not found or cross-tenant access forbidden');
    }

    if (version.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException('BR-051: Only DRAFT versions can be modified. Active/Archived versions are immutable.');
    }
  }

  async validateCompletenessForActivation(tenantId: string, versionId: string): Promise<void> {
    const version = await this.prisma.configVersion.findUnique({
      where: { id: versionId },
      include: {
        categories: true,
        policies: true,
        slaConfig: true,
        duplicateConf: true,
        billingConf: true,
        paymentConf: true,
      }
    });

    if (!version) throw new BadRequestException('Version not found');

    // BR-053: Cannot activate incomplete config
    const missing = [];
    if (version.categories.length === 0) missing.push('Expense Categories');
    if (!version.slaConfig) missing.push('SLA Configuration');
    if (!version.duplicateConf) missing.push('Duplicate Detection Configuration');
    if (!version.billingConf) missing.push('Billing Configuration');
    if (!version.paymentConf) missing.push('Payment Configuration');

    if (missing.length > 0) {
      throw new BadRequestException(`BR-053: Cannot activate incomplete config. Missing: ${missing.join(', ')}`);
    }
  }
}
