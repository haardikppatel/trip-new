import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigValidationEngine } from '../domain/config-validation.engine';
import { ConfigAuditWriter } from '../infrastructure/config-audit.writer';
import { ConfigCacheService } from '../infrastructure/config-cache.service';
import { ConfigEventPublisher } from '../infrastructure/config-event.publisher';
import { TenantContext } from '@tripaxis/core';
import { ConfigStatus } from '@prisma/client';

@Injectable()
export class ConfigActivationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ConfigValidationEngine,
    private readonly auditWriter: ConfigAuditWriter,
    private readonly cacheService: ConfigCacheService,
    private readonly eventPublisher: ConfigEventPublisher,
  ) {}

  async activateVersion(versionId: string) {
    const context = TenantContext.getOrThrow();
    const tenantId = context.tenantId;

    await this.validator.validateCompletenessForActivation(tenantId, versionId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Archive current active version
      await tx.configVersion.updateMany({
        where: { tenantId, status: ConfigStatus.ACTIVE },
        data: { status: ConfigStatus.ARCHIVED }
      });

      // 2. Activate new version
      const activatedVersion = await tx.configVersion.update({
        where: { id: versionId },
        data: { 
          status: ConfigStatus.ACTIVE,
          activatedAt: new Date()
        },
        include: {
          categories: true,
          policies: true,
          slaConfig: true,
          duplicateConf: true,
          billingConf: true,
          paymentConf: true,
        }
      });

      // 3. Audit
      await this.auditWriter.logChange(tenantId, versionId, 'VERSION_ACTIVATED', context.userId, tx);

      // 4. Invalidate Cache
      await this.cacheService.invalidateConfig(tenantId);
      // Pre-warm cache
      await this.cacheService.setActiveConfig(tenantId, activatedVersion);

      // 5. Emit Event
      this.eventPublisher.publishConfigActivated(tenantId, versionId);

      return activatedVersion;
    });
  }
}
