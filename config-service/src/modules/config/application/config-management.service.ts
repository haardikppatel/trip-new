import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigValidationEngine } from '../domain/config-validation.engine';
import { ConfigAuditWriter } from '../infrastructure/config-audit.writer';
import { ConfigEventPublisher } from '../infrastructure/config-event.publisher';
import { ConfigCacheService } from '../infrastructure/config-cache.service';
import { TenantContext } from '@tripaxis/core';
import { ConfigStatus } from '@prisma/client';
import * as DTO from '../dto/config.dto';

@Injectable()
export class ConfigManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ConfigValidationEngine,
    private readonly auditWriter: ConfigAuditWriter,
    private readonly eventPublisher: ConfigEventPublisher,
    private readonly cacheService: ConfigCacheService,
  ) {}

  async getOrCreateDraftVersion(tenantId: string) {
    let draft = await this.prisma.configVersion.findFirst({
      where: { tenantId, status: ConfigStatus.DRAFT }
    });

    if (!draft) {
      // BR-055: Version numbers increment sequentially
      const lastVersion = await this.prisma.configVersion.findFirst({
        where: { tenantId },
        orderBy: { versionNumber: 'desc' }
      });
      const nextNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      draft = await this.prisma.configVersion.create({
        data: { tenantId, versionNumber: nextNumber, status: ConfigStatus.DRAFT }
      });
    }
    return draft;
  }

  async addCategory(dto: DTO.CreateCategoryDto) {
    const context = TenantContext.getOrThrow();
    const draft = await this.getOrCreateDraftVersion(context.tenantId);

    const category = await this.prisma.expenseCategory.create({
      data: {
        tenantId: context.tenantId,
        versionId: draft.id,
        name: dto.name,
        code: dto.code,
        rules: dto.rules as any,
        active: dto.active ?? true,
      }
    });

    await this.auditWriter.logChange(context.tenantId, draft.id, 'CATEGORY_ADDED', context.userId);
    this.eventPublisher.publishPolicyUpdated(context.tenantId, draft.id, 'CATEGORY');
    return category;
  }

  async setSlaConfig(dto: DTO.CreateSlaConfigDto) {
    const context = TenantContext.getOrThrow();
    const draft = await this.getOrCreateDraftVersion(context.tenantId);

    const sla = await this.prisma.sLAConfig.upsert({
      where: { versionId: draft.id },
      update: {
        managerHours: dto.managerHours,
        financeHours: dto.financeHours,
        payableDays: dto.payableDays,
        escalationRoles: dto.escalationRoles as any,
      },
      create: {
        tenantId: context.tenantId,
        versionId: draft.id,
        managerHours: dto.managerHours,
        financeHours: dto.financeHours,
        payableDays: dto.payableDays,
        escalationRoles: dto.escalationRoles as any,
      }
    });

    await this.auditWriter.logChange(context.tenantId, draft.id, 'SLA_CONFIG_UPDATED', context.userId);
    return sla;
  }

  async getActiveConfig() {
    const context = TenantContext.getOrThrow();
    
    // Lazy-load from cache
    const cached = await this.cacheService.getActiveConfig(context.tenantId);
    if (cached) return cached;

    const activeVersion = await this.prisma.configVersion.findFirst({
      where: { tenantId: context.tenantId, status: ConfigStatus.ACTIVE },
      include: {
        categories: true,
        policies: true,
        slaConfig: true,
        duplicateConf: true,
        billingConf: true,
        paymentConf: true,
      }
    });

    if (activeVersion) {
      await this.cacheService.setActiveConfig(context.tenantId, activeVersion);
    }

    return activeVersion;
  }
}
