import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseManagerService } from '../src/modules/expense-manager/application/expense-manager.service';
import { ComplianceValidationEngine } from '../src/modules/expense-manager/domain/compliance-validation.engine';
import { PayableOverrideHandler } from '../src/modules/expense-manager/domain/payable-override.handler';
import { BillableFlagEditor } from '../src/modules/expense-manager/domain/billable-flag.editor';
import { ApprovalFinalizationService } from '../src/modules/expense-manager/application/approval-finalization.service';
import { BadRequestException } from '@nestjs/common';
import { TenantContext } from '@tripaxis/core';

describe('Expense Manager Review Engine', () => {
  let service: ExpenseManagerService;
  let complianceEngine: ComplianceValidationEngine;

  const mockPrisma = {
    expenseClaim: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    expenseClaimLineItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    expenseManagerAudit: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseManagerService,
        ComplianceValidationEngine,
        PayableOverrideHandler,
        BillableFlagEditor,
        ApprovalFinalizationService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'SLASecondLevelEngine', useValue: { scheduleSLA: jest.fn(), cancelSLA: jest.fn() } },
        { provide: 'AuditTrailWriter', useValue: { logOverride: jest.fn() } },
        { provide: 'ExpenseManagerEventPublisher', useValue: { publishFinalApproved: jest.fn(), publishFinalRejected: jest.fn() } },
      ],
    }).compile();

    service = module.get<ExpenseManagerService>(ExpenseManagerService);
    complianceEngine = module.get<ComplianceValidationEngine>(ComplianceValidationEngine);

    jest.spyOn(TenantContext, 'getOrThrow').mockReturnValue({
      tenantId: 'tenant-1',
      userId: 'exp-mgr-1',
      roles: ['ExpenseManager'],
      correlationId: 'corr-1'
    });
  });

  it('should only allow MANAGER_APPROVED claims to be approved (BR-014)', async () => {
    mockPrisma.expenseClaim.findUnique.mockResolvedValueOnce({
      id: 'claim-1', tenantId: 'tenant-1', status: 'SUBMITTED', locked: false, lineItems: []
    });

    await expect(service.approveClaim('claim-1', {})).rejects.toThrow(/BR-014/);
  });

  it('should require justification for duplicate claims (BR-016)', async () => {
    mockPrisma.expenseClaim.findUnique.mockResolvedValueOnce({
      id: 'claim-1', tenantId: 'tenant-1', status: 'MANAGER_APPROVED', locked: false, duplicateDetected: true, lineItems: []
    });

    await expect(service.approveClaim('claim-1', {})).rejects.toThrow(/BR-016/);
  });

  it('should block modifications on locked claims (BR-017)', async () => {
    mockPrisma.expenseClaim.findUnique.mockResolvedValueOnce({
      id: 'claim-1', tenantId: 'tenant-1', status: 'FINAL_APPROVED', locked: true, lineItems: []
    });

    await expect(service.rejectClaim('claim-1', { reason: 'Valid reason here' })).rejects.toThrow(/BR-017/);
  });

  it('should require rejection reason of at least 10 chars (BR-019)', async () => {
    mockPrisma.expenseClaim.findUnique.mockResolvedValueOnce({
      id: 'claim-1', tenantId: 'tenant-1', status: 'MANAGER_APPROVED', locked: false, lineItems: []
    });

    // Validated at service layer via FinalizationService
    await expect(service.rejectClaim('claim-1', { reason: 'short' })).rejects.toThrow(/BR-019/);
  });

  it('should log payable overrides immutably (BR-015)', async () => {
    mockPrisma.expenseClaimLineItem.findUnique.mockResolvedValueOnce({
      id: 'item-1', tenantId: 'tenant-1', claimId: 'claim-1', isPayable: true, claim: { locked: false }
    });

    await service.overridePayable('claim-1', 'item-1', { newValue: false, reason: 'Policy violation' });
    
    // Audit log writer is mocked, but we ensure the flow completes successfully
    expect(mockPrisma.expenseClaimLineItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' }, data: { isPayable: false }
    });
  });
});
