import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentCallbackDto } from '../dto/payment.dto';
import { PaymentGatewayAdapter } from '../domain/payment-gateway.adapter';
import { PaymentEventPublisher } from '../infrastructure/payment-event.publisher';
import { PayableStatus, TransactionStatus } from '@prisma/client';

@Injectable()
export class PaymentCallbackService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('PaymentGatewayAdapter') private readonly paymentAdapter: PaymentGatewayAdapter,
    private readonly eventPublisher: PaymentEventPublisher,
  ) {}

  async handleCallback(tenantId: string, payload: PaymentCallbackDto, signature: string) {
    // Security: Verify signature
    if (!this.paymentAdapter.verifyCallbackSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid callback signature');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.findUnique({
        where: { externalTransactionId: payload.externalTransactionId },
        include: { claim: true }
      });

      if (!transaction || transaction.tenantId !== tenantId) {
        throw new BadRequestException('Transaction not found');
      }

      // Idempotency: Ignore if already processed
      if (transaction.status !== TransactionStatus.INITIATED) {
        return { message: 'Callback already processed' };
      }

      // BR-033: Callback mismatch amount -> reject
      if (Number(transaction.amount) !== payload.amount || transaction.currency !== payload.currency) {
        throw new BadRequestException('BR-033: Amount or currency mismatch in callback');
      }

      const isSuccess = payload.status === 'SUCCESS';

      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
          failureReason: payload.failureReason,
        }
      });

      if (isSuccess) {
        await tx.expenseClaim.update({
          where: { id: transaction.claimId },
          data: {
            payableStatus: PayableStatus.PAID,
            paidAt: new Date(),
            version: { increment: 1 }
          }
        });
        this.eventPublisher.publishPaymentCompleted(
          transaction.claimId,
          payload.externalTransactionId,
          payload.amount,
          payload.currency,
          tenantId
        );
      } else {
        await tx.expenseClaim.update({
          where: { id: transaction.claimId },
          data: {
            payableStatus: PayableStatus.ELIGIBLE, // Revert to eligible for retry
            paymentRunId: null,
            version: { increment: 1 }
          }
        });
        this.eventPublisher.publishPaymentFailed(
          transaction.claimId,
          payload.failureReason || 'Payment failed at gateway',
          tenantId
        );
      }

      return { success: true };
    });
  }
}
