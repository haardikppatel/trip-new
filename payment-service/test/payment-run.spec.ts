import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRunService } from '../src/modules/payment/application/payment-run.service';
import { PaymentCallbackService } from '../src/modules/payment/application/payment-callback.service';
import { RedisLockService } from '../src/modules/payment/infrastructure/redis-lock.service';
import { MockPaymentAdapter } from '../src/modules/payment/infrastructure/mock-payment.adapter';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { TenantContext } from '@tripaxis/core';
import { PayableStatus, TransactionStatus } from '@prisma/client';

describe('Payment Run & Disbursement Engine', () => {
  let runService: PaymentRunService;
  let callbackService: PaymentCallbackService;
  let redisLock: RedisLockService;

  const mockPrisma = {
    paymentRun: { findUnique: jest.fn(), create: jest.fn() },
    expenseClaim: { findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    paymentTransaction: { create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    paymentRunAudit: { create: jest.fn() },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRunService,
        PaymentCallbackService,
        { provide: RedisLockService, useValue: { acquireLock: jest.fn().mockResolvedValue(true), releaseLock: jest.fn() } },
        { provide: 'PaymentGatewayAdapter', useClass: MockPaymentAdapter },
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: 'PaymentEventPublisher', useValue: { publishPaymentStarted: jest.fn(), publishPaymentCompleted: jest.fn(), publishPaymentFailed: jest.fn() } },
      ],
    }).compile();

    runService = module.get<PaymentRunService>(PaymentRunService);
    callbackService = module.get<PaymentCallbackService>(PaymentCallbackService);
    redisLock = module.get<RedisLockService>(RedisLockService);

    jest.spyOn(TenantContext, 'getOrThrow').mockReturnValue({
      tenantId: 'tenant-1',
      userId: 'finance-admin-1',
      roles: ['FinanceAdmin'],
      correlationId: 'corr-1'
    });
  });

  it('should block concurrent runs per tenant (BR-034)', async () => {
    jest.spyOn(redisLock, 'acquireLock').mockResolvedValueOnce(false);
    await expect(runService.triggerPaymentRun('idem-1')).rejects.toThrow(ConflictException);
  });

  it('should only include Eligible claims (BR-030) and block duplicates without override (BR-032)', async () => {
    mockPrisma.paymentRun.findUnique.mockResolvedValueOnce(null);
    mockPrisma.expenseClaim.findMany.mockResolvedValueOnce([]); // No eligible claims

    await expect(runService.triggerPaymentRun('idem-1')).rejects.toThrow(BadRequestException);
    expect(mockPrisma.expenseClaim.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        payableStatus: PayableStatus.ELIGIBLE,
        OR: [{ duplicateDetected: false }, { payableOverrideReason: { not: null } }]
      })
    });
  });

  it('should reject callback with invalid signature', async () => {
    await expect(callbackService.handleCallback('tenant-1', {
      externalTransactionId: 'ext-1', claimId: 'c1', status: 'SUCCESS', amount: 100, currency: 'USD'
    }, 'invalid-sig')).rejects.toThrow(UnauthorizedException);
  });

  it('should reject callback with amount mismatch (BR-033)', async () => {
    mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
      id: 'txn-1', tenantId: 'tenant-1', status: TransactionStatus.INITIATED, amount: 100, currency: 'USD'
    });

    await expect(callbackService.handleCallback('tenant-1', {
      externalTransactionId: 'ext-1', claimId: 'c1', status: 'SUCCESS', amount: 50, currency: 'USD'
    }, 'valid-signature')).rejects.toThrow(/BR-033/);
  });

  it('should process successful callback and update claim to PAID', async () => {
    mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
      id: 'txn-1', tenantId: 'tenant-1', claimId: 'c1', status: TransactionStatus.INITIATED, amount: 100, currency: 'USD'
    });

    await callbackService.handleCallback('tenant-1', {
      externalTransactionId: 'ext-1', claimId: 'c1', status: 'SUCCESS', amount: 100, currency: 'USD'
    }, 'valid-signature');

    expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-1' }, data: expect.objectContaining({ status: TransactionStatus.SUCCESS })
    });
    expect(mockPrisma.expenseClaim.update).toHaveBeenCalledWith({
      where: { id: 'c1' }, data: expect.objectContaining({ payableStatus: PayableStatus.PAID })
    });
  });
});
