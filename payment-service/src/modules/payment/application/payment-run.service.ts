import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisLockService } from '../infrastructure/redis-lock.service';
import { PaymentGatewayAdapter } from '../domain/payment-gateway.adapter';
import { PaymentEventPublisher } from '../infrastructure/payment-event.publisher';
import { TenantContext } from '@tripaxis/core';
import { v4 as uuidv4 } from 'uuid';
import { PayableStatus, PaymentRunStatus } from '@prisma/client';

@Injectable()
export class PaymentRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisLock: RedisLockService,
    @Inject('PaymentGatewayAdapter') private readonly paymentAdapter: PaymentGatewayAdapter,
    private readonly eventPublisher: PaymentEventPublisher,
  ) {}

  async triggerPaymentRun(idempotencyKey: string) {
    const context = TenantContext.getOrThrow();
    const tenantId = context.tenantId;
    const lockKey = `payment-run:lock:${tenantId}`;

    // BR-034: Run must be atomic per tenant
    const acquired = await this.redisLock.acquireLock(lockKey, 300); // 5 mins lock
    if (!acquired) {
      throw new ConflictException('A payment run is already in progress for this tenant');
    }

    try {
      // Idempotency check
      const existingRun = await this.prisma.paymentRun.findUnique({
        where: { idempotencyKey }
      });
      if (existingRun) return existingRun;

      // BR-030: Only Eligible claims included
      // BR-032: Duplicate flagged claims blocked unless override
      const eligibleClaims = await this.prisma.expenseClaim.findMany({
        where: {
          tenantId,
          payableStatus: PayableStatus.ELIGIBLE,
          OR: [
            { duplicateDetected: false },
            { payableOverrideReason: { not: null } }
          ]
        }
      });

      if (eligibleClaims.length === 0) {
        throw new BadRequestException('No eligible claims found for payment run');
      }

      const totalAmount = eligibleClaims.reduce((sum, claim) => sum + Number(claim.totalAmountBase), 0);
      const runReference = `PR-${Date.now()}`;

      const paymentRun = await this.prisma.$transaction(async (tx) => {
        const run = await tx.paymentRun.create({
          data: {
            tenantId,
            runReference,
            idempotencyKey,
            triggeredByUserId: context.userId,
            status: PaymentRunStatus.PROCESSING,
            totalAmount,
            totalClaims: eligibleClaims.length,
          }
        });

        await tx.paymentRunAudit.create({
          data: {
            tenantId,
            paymentRunId: run.id,
            action: 'RUN_CREATED',
            actorId: context.userId,
            details: `Initiated run for ${eligibleClaims.length} claims`
          }
        });

        for (const claim of eligibleClaims) {
          // Optimistic locking update
          const updated = await tx.expenseClaim.updateMany({
            where: { id: claim.id, version: claim.version, payableStatus: PayableStatus.ELIGIBLE },
            data: {
              payableStatus: PayableStatus.PAYMENT_IN_PROCESS,
              paymentRunId: run.id,
              version: { increment: 1 }
            }
          });

          if (updated.count === 0) {
            throw new ConflictException(`Claim ${claim.id} was modified concurrently`);
          }

          await tx.paymentTransaction.create({
            data: {
              tenantId,
              claimId: claim.id,
              paymentRunId: run.id,
              amount: claim.totalAmountBase,
              currency: claim.currency,
            }
          });
        }

        return run;
      });

      // Group by currency (Simplified)
      const batchItems = eligibleClaims.map(c => ({
        claimId: c.id,
        amount: Number(c.totalAmountBase),
        currency: c.currency,
        bankDetails: {} // Mock
      }));

      // Call Gateway
      const gatewayResult = await this.paymentAdapter.initiateBatch(tenantId, batchItems);

      // Persist Gateway Response
      await this.prisma.$transaction(async (tx) => {
        for (const txn of gatewayResult.transactions) {
          await tx.paymentTransaction.updateMany({
            where: { claimId: txn.claimId, paymentRunId: paymentRun.id },
            data: {
              externalTransactionId: txn.externalTransactionId,
              status: txn.status === 'INITIATED' ? 'INITIATED' : 'FAILED',
              failureReason: txn.failureReason,
            }
          });

          if (txn.status === 'INITIATED') {
            this.eventPublisher.publishPaymentStarted(txn.claimId, paymentRun.id, tenantId);
          } else {
            // Revert claim status if initiation failed
            await tx.expenseClaim.update({
              where: { id: txn.claimId },
              data: { payableStatus: PayableStatus.ELIGIBLE, paymentRunId: null }
            });
            this.eventPublisher.publishPaymentFailed(txn.claimId, txn.failureReason || 'Initiation failed', tenantId);
          }
        }
      });

      return paymentRun;

    } finally {
      await this.redisLock.releaseLock(lockKey);
    }
  }

  async getRunDetails(runId: string) {
    const context = TenantContext.getOrThrow();
    return this.prisma.paymentRun.findFirst({
      where: { id: runId, tenantId: context.tenantId },
      include: { transactions: true, audits: true }
    });
  }
}
