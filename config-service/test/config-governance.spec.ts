import { Test, TestingModule } from '@nestjs/testing';
import { ConfigActivationService } from '../src/modules/config/application/config-activation.service';
import { ConfigValidationEngine } from '../src/modules/config/domain/config-validation.engine';
import { ConfigManagementService } from '../src/modules/config/application/config-management.service';
import { BadRequestException } from '@nestjs/common';
import { TenantContext } from '@tripaxis/core';
import { ConfigStatus } from '@prisma/client';

describe('Expense Configuration & Governance Service', () => {
  let activationService: ConfigActivationService;
  let validationEngine: ConfigValidationEngine;
  let managementService: ConfigManagementService;

  const mockPrisma = {
    configVersion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    expenseCategory: { create: jest.fn() },
    configAudit: { create: jest.fn() },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigActivationService,
        ConfigValidationEngine,
        ConfigManagementService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'ConfigAuditWriter', useValue: { logChange: jest.fn() } },
        { provide: 'ConfigCacheService', useValue: { invalidateConfig: jest.fn(), setActiveConfig: jest.fn(), getActiveConfig: jest.fn() } },
        { provide: 'ConfigEventPublisher', useValue: { publishConfigActivated: jest.fn(), publishPolicyUpdated: jest.fn() } },
      ],
    }).compile();

    activationService = module.get<ConfigActivationService>(ConfigActivationService);
    validationEngine = module.get<ConfigValidationEngine>(ConfigValidationEngine);
    managementService = module.get<ConfigManagementService>(ConfigManagementService);

    jest.spyOn(TenantContext, 'getOrThrow').mockReturnValue({
      tenantId: 'tenant-1',
      userId: 'admin-1',
      roles: ['AppAdmin'],
      correlationId: 'corr-1'
    });
  });

  it('should block modification of active versions (BR-051)', async () => {
    mockPrisma.configVersion.findUnique.mockResolvedValueOnce({
      id: 'v1', tenantId: 'tenant-1', status: ConfigStatus.ACTIVE
    });

    await expect(validationEngine.validateDraftModifiable('tenant-1', 'v1')).rejects.toThrow(/BR-051/);
  });

  it('should block activation of incomplete config (BR-053)', async () => {
    mockPrisma.configVersion.findUnique.mockResolvedValueOnce({
      id: 'v1', tenantId: 'tenant-1', status: ConfigStatus.DRAFT,
      categories: [], // Missing categories
      slaConfig: null, // Missing SLA
      duplicateConf: null,
      billingConf: null,
      paymentConf: null,
    });

    await expect(activationService.activateVersion('v1')).rejects.toThrow(/BR-053/);
  });

  it('should successfully activate a complete config and archive the old one', async () => {
    mockPrisma.configVersion.findUnique.mockResolvedValueOnce({
      id: 'v2', tenantId: 'tenant-1', status: ConfigStatus.DRAFT,
      categories: [{ id: 'cat1' }],
      slaConfig: { id: 'sla1' },
      duplicateConf: { id: 'dup1' },
      billingConf: { id: 'bill1' },
      paymentConf: { id: 'pay1' },
    });

    mockPrisma.configVersion.update.mockResolvedValueOnce({ id: 'v2', status: ConfigStatus.ACTIVE });

    await activationService.activateVersion('v2');

    expect(mockPrisma.configVersion.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', status: ConfigStatus.ACTIVE },
      data: { status: ConfigStatus.ARCHIVED }
    });
    expect(mockPrisma.configVersion.update).toHaveBeenCalledWith({
      where: { id: 'v2' },
      data: expect.objectContaining({ status: ConfigStatus.ACTIVE })
    });
  });

  it('should automatically increment version numbers sequentially (BR-055)', async () => {
    mockPrisma.configVersion.findFirst.mockResolvedValueOnce(null); // No draft exists
    mockPrisma.configVersion.findFirst.mockResolvedValueOnce({ versionNumber: 4 }); // Last version was 4
    mockPrisma.configVersion.create.mockResolvedValueOnce({ id: 'v5', versionNumber: 5 });

    const draft = await managementService.getOrCreateDraftVersion('tenant-1');
    expect(mockPrisma.configVersion.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', versionNumber: 5, status: ConfigStatus.DRAFT }
    });
  });
});
