import { BaseDomainEvent } from '@tripaxis/core';

export class ExpenseSubmittedEvent extends BaseDomainEvent<{ expenseId: string; totalAmount: number }> {
  constructor(payload: { expenseId: string; totalAmount: number }) {
    super('ExpenseSubmitted', payload);
  }
}

export class ExpenseApprovedEvent extends BaseDomainEvent<{ expenseId: string; approverId: string; role: string }> {
  constructor(payload: { expenseId: string; approverId: string; role: string }) {
    super('ExpenseApproved', payload);
  }
}

export class ExpenseRejectedEvent extends BaseDomainEvent<{ expenseId: string; rejectorId: string; reason: string }> {
  constructor(payload: { expenseId: string; rejectorId: string; reason: string }) {
    super('ExpenseRejected', payload);
  }
}

export class ReimbursementInitiatedEvent extends BaseDomainEvent<{ expenseId: string; amount: number }> {
  constructor(payload: { expenseId: string; amount: number }) {
    super('ReimbursementInitiated', payload);
  }
}
