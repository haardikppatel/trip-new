import { Injectable, BadRequestException } from '@nestjs/common';
import { PayableStatus, BillableStatus } from '@prisma/client';

@Injectable()
export class FlagTransitionValidator {
  validatePayableEligibility(claim: any, financeOverrideReason?: string): void {
    // BR-021: Only FinalApproved claims may become Eligible
    if (claim.status !== 'FINAL_APPROVED' || !claim.locked) {
      throw new BadRequestException('BR-021: Claim must be FinalApproved and locked to become Eligible');
    }

    if (claim.duplicateDetected && !financeOverrideReason) {
      throw new BadRequestException('Duplicate detected: Cannot move to Eligible without Finance override');
    }
  }

  validatePaidTransition(paymentReferenceId?: string): void {
    if (!paymentReferenceId) {
      throw new BadRequestException('Cannot mark Paid without payment_reference_id');
    }
  }

  validateInvoiceTransition(invoiceReferenceId?: string): void {
    if (!invoiceReferenceId) {
      throw new BadRequestException('Cannot mark Invoiced without invoice_reference_id');
    }
  }

  validateWriteOff(reason?: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('WrittenOff requires justification');
    }
  }
}
