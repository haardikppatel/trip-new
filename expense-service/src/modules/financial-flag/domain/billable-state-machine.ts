import { Injectable, BadRequestException } from '@nestjs/common';
import { BillableStatus } from '@prisma/client';

@Injectable()
export class BillableStateMachine {
  private readonly allowedTransitions: Record<BillableStatus, BillableStatus[]> = {
    [BillableStatus.NOT_BILLABLE]: [BillableStatus.BILLABLE],
    [BillableStatus.BILLABLE]: [BillableStatus.INVOICE_GENERATED, BillableStatus.WRITTEN_OFF, BillableStatus.NOT_BILLABLE],
    [BillableStatus.INVOICE_GENERATED]: [BillableStatus.INVOICED], // BR-024: InvoiceGenerated cannot revert to Billable
    [BillableStatus.INVOICED]: [],
    [BillableStatus.WRITTEN_OFF]: [], // BR-025: WrittenOff is terminal
  };

  validateTransition(currentStatus: BillableStatus, nextStatus: BillableStatus): void {
    if (currentStatus === nextStatus) return;

    const allowed = this.allowedTransitions[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestException(`Invalid billable status transition from ${currentStatus} to ${nextStatus}`);
    }
  }
}
