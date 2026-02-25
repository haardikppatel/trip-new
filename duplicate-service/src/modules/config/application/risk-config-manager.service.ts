import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TenantContext } from '@tripaxis/core';

@Injectable()
export class RiskConfigManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async updateConfig(ruleName: string, weight: number, active: boolean) {
    const context = TenantContext.getOrThrow();
    const tenantId = context.tenantId;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.duplicateRuleConfig.findUnique({
        where: { tenantId_ruleName: { tenantId, ruleName } }
      });

      const updated = await tx.duplicateRuleConfig.upsert({
        where: { tenantId_ruleName: { tenantId, ruleName } },
        update: { weight, active },
        create: { tenantId, ruleName, weight, active }
      });

      // Append-only audit log
      await tx.duplicateConfigAudit.create({
        data: {
          tenantId,
          actorId: context.userId,
          ruleName,
          oldWeight: existing?.weight,
          newWeight: weight,
          oldActive: existing?.active,
          newActive: active,
        }
      });

      return updated;
    });
  }
}
