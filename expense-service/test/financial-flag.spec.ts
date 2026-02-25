import { Test, TestingModule } from '@nestjs/testing';
import { FinancialFlagService } from '../src/modules/financial-flag/application/financial-flag.service';
import { PayableStateMachine } from '../src/modules/financial-flag/domain/payable-state-machine';
import { BillableStateMachine } from '../src/modules/financial-flag/domain/billable-state-machine';
import { FlagTransitionValidator } from '../src/modules/financial-flag/domain/flag-transition.validator';
import { BadRequestException } from '@nestjs/common';
import { TenantContext } from '@tripaxis/core';
import { PayableStatus, BillableStatus } from '@prisma/client';

describe('Financial Flag Lifecycle Engine', () => {
  let service: FinancialFlagService;
  let payableStateMachine: PayableStateMachine;
  let billableStateMachine: BillableStateMachine;
  let transitionValidator: FlagTransitionValidator;

  const mockPrisma = {
    expenseClaim: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    financialFlagAudit: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialFlagService,
        PayableStateMachine,
        BillableStateMachine,
        FlagTransitionValidator,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'FlagAuditWriter', useValue: { logTransition: jest.fn() } },
        { provide: 'PaymentEligibilityPublisher', useValue: { publishEligible: jest.fn(), publishPaymentStarted: jest.fn(), publishPaymentCompleted: jest.fn() } },
        { provide: 'BillingEligibilityPublisher', useValue: { publishEligible: jest.fn(), publishInvoiceGenerated: jest.fn(), publishInvoiceConfirmed: jest.fn() } },
        { provide: 'PayableSlaScheduler', useValue: { scheduleSlaAlert: jest.fn(), cancelSlaAlert: jest.fn() } },
      ],
    }).compile();

    service = module.get<FinancialFlagService>(FinancialFlagService);
    payableStateMachine = module.get<PayableStateMachine>(PayableStateMachine);
    billableStateMachine = module.get<BillableStateMachine>(BillableStateMachine);
    transitionValidator = module.get<FlagTransitionValidator>(FlagTransitionValidator);

    jest.spyOn(TenantContext, 'getOrThrow').mockReturnValue({
      tenantId: 'tenant-1',
      userId: 'finance-1',
      roles: ['FinanceAdmin'],
      correlationId: 'corr-1'
    });
  });

  it('should block cross-tenant transitions (BR-026)', async () => {
    mockPrisma.expenseClaim.findUnique.mockResolvedValueOnce({
      id: 'claim-1', tenantId: 'tenant-2', payableStatus: PayableStatus.NOT_ELIGIBLE
    });

    await expect(service.updatePayableStatus('claim-1', { status: PayableStatus.ELIGIBLE, reason: 'Test' }))
      .rejects.toThrow(/BR-026/);
  });

  it('should block Eligible transition if not FinalApproved (BR-021)', async () => {
    mockPrisma.expenseClaim.findUnique.mockResolvedValueOnce({
      id: 'claim-1', tenantId: 'tenant-1', payableStatus: PayableStatus.NOT_ELIGIBLE, status: 'SUBMITTED', locked: false
    });

    await expect(service.updatePayableStatus('claim-1', { status: PayableStatus.ELIGIBLE, reason: 'Test' }))
      .rejects.toThrow(/BR-021/);
  });

  it('should block transition from Paid to Eligible (BR-022)', async () => {
    expect(() => payableStateMachine.validateTransition(PayableStatus.PAID, PayableStatus.ELIGIBLE))
      .toThrow(BadRequestException);
  });

  it('should block transition from Cancelled to Eligible (BR-023)', async () => {
    expect(() => payableStateMachine.validateTransition(PayableStatus.CANCELLED, PayableStatus.ELIGIBLE))
      .toThrow(BadRequestException);
  });

  it('should block transition from InvoiceGenerated to Billable (BR-024)', async () => {
    expect(() => billableStateMachine.validateTransition(BillableStatus.INVOICE_GENERATED, BillableStatus.BILLABLE))
      .toThrow(BadRequestException);
  });

  it('should block transition out of WrittenOff (BR-025)', async () => {
    expect(() => billableStateMachine.validateTransition(BillableStatus.WRITTEN_OFF, BillableStatus.BILLABLE))
      .toThrow(BadRequestException);
  });

  it('should require payment reference id for Paid transition', async () => {
    expect(() => transitionValidator.validatePaidTransition(undefined))
      .toThrow(/payment_reference_id/);
  });
});
