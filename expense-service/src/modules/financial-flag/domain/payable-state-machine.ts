import { Injectable, BadRequestException } from '@nestjs/common';
import { PayableStatus } from '@prisma/client';

@Injectable()
export class PayableStateMachine {
  private readonly allowedTransitions: Record<PayableStatus, PayableStatus[]> = {
    [PayableStatus.NOT_ELIGIBLE]: [PayableStatus.ELIGIBLE, PayableStatus.CANCELLED],
    [PayableStatus.ELIGIBLE]: [PayableStatus.PAYMENT_IN_PROCESS, PayableStatus.CANCELLED],
    [PayableStatus.PAYMENT_IN_PROCESS]: [PayableStatus.PAID, PayableStatus.ELIGIBLE],
    [PayableStatus.PAID]: [], // BR-022: Paid claims immutable
    [PayableStatus.CANCELLED]: [], // BR-023: Cancelled claims cannot become Eligible
  };

  validateTransition(currentStatus: PayableStatus, nextStatus: PayableStatus): void {
    if (currentStatus === nextStatus) return;

    const allowed = this.allowedTransitions[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestException(`Invalid payable status transition from ${currentStatus} to ${nextStatus}`);
    }
  }
}
