import { BadRequestException } from '@nestjs/common';
import { ExpenseStatus } from '@prisma/client';

export class ExpenseStateMachine {
  private static readonly transitions: Record<ExpenseStatus, ExpenseStatus[]> = {
    [ExpenseStatus.DRAFT]: [ExpenseStatus.SUBMITTED],
    [ExpenseStatus.SUBMITTED]: [ExpenseStatus.MANAGER_APPROVED, ExpenseStatus.REJECTED],
    [ExpenseStatus.MANAGER_APPROVED]: [ExpenseStatus.FINANCE_APPROVED, ExpenseStatus.REJECTED],
    [ExpenseStatus.FINANCE_APPROVED]: [ExpenseStatus.REIMBURSEMENT_INITIATED],
    [ExpenseStatus.REJECTED]: [ExpenseStatus.DRAFT],
    [ExpenseStatus.REIMBURSEMENT_INITIATED]: [],
  };

  static canTransition(currentStatus: ExpenseStatus, nextStatus: ExpenseStatus): boolean {
    const allowed = this.transitions[currentStatus];
    return allowed && allowed.includes(nextStatus);
  }

  static assertTransition(currentStatus: ExpenseStatus, nextStatus: ExpenseStatus): void {
    if (!this.canTransition(currentStatus, nextStatus)) {
      throw new BadRequestException(`Cannot transition expense from ${currentStatus} to ${nextStatus}`);
    }
  }
}
