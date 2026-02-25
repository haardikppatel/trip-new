import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventPublisher } from '../../messaging/event.publisher';
import { ExpenseStateMachine } from '../domain/state-machine/expense.state-machine';
import { ExpenseSubmittedEvent, ExpenseApprovedEvent } from '../domain/events/expense.events';
import { TenantContext, AuditLogger } from '@tripaxis/core';
import { ExpenseStatus } from '@prisma/client';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly auditLogger: AuditLogger,
  ) {}

  async submitExpense(idempotencyKey: string, totalAmount: number, currency: string) {
    const context = TenantContext.getOrThrow();

    // Idempotency check
    const existing = await this.prisma.expense.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      if (existing.status !== ExpenseStatus.DRAFT) {
        throw new ConflictException('Expense already submitted');
      }
      // If it's a draft, we can proceed to submit it
    }

    const expense = await this.prisma.withTenantContext(async (tx) => {
      const exp = await tx.expense.upsert({
        where: { idempotencyKey },
        create: {
          tenantId: context.tenantId,
          userId: context.userId,
          totalAmount,
          currency,
          status: ExpenseStatus.SUBMITTED,
          idempotencyKey,
        },
        update: {
          status: ExpenseStatus.SUBMITTED,
        },
      });

      await tx.expenseAuditLog.create({
        data: {
          expenseId: exp.id,
          tenantId: context.tenantId,
          actorId: context.userId,
          action: 'SUBMITTED',
          afterState: JSON.parse(JSON.stringify(exp)),
        },
      });

      return exp;
    });

    this.auditLogger.log({
      entityId: expense.id,
      entityType: 'Expense',
      action: 'SUBMITTED',
      afterState: expense,
    });

    await this.publisher.publish(new ExpenseSubmittedEvent({
      expenseId: expense.id,
      totalAmount: Number(expense.totalAmount),
    }));

    return expense;
  }

  async approveExpense(expenseId: string, role: 'Manager' | 'Finance') {
    const context = TenantContext.getOrThrow();

    const expense = await this.prisma.withTenantContext(async (tx) => {
      const exp = await tx.expense.findUniqueOrThrow({ where: { id: expenseId } });
      
      const nextStatus = role === 'Manager' ? ExpenseStatus.MANAGER_APPROVED : ExpenseStatus.FINANCE_APPROVED;
      ExpenseStateMachine.assertTransition(exp.status, nextStatus);

      const updated = await tx.expense.update({
        where: { id: expenseId },
        data: { status: nextStatus },
      });

      await tx.expenseApprovalStep.create({
        data: {
          expenseId: updated.id,
          tenantId: context.tenantId,
          approverId: context.userId,
          role,
          status: 'APPROVED',
          decidedAt: new Date(),
        },
      });

      await tx.expenseAuditLog.create({
        data: {
          expenseId: updated.id,
          tenantId: context.tenantId,
          actorId: context.userId,
          action: `${role.toUpperCase()}_APPROVED`,
          beforeState: JSON.parse(JSON.stringify(exp)),
          afterState: JSON.parse(JSON.stringify(updated)),
        },
      });

      return updated;
    });

    this.auditLogger.log({
      entityId: expense.id,
      entityType: 'Expense',
      action: `${role.toUpperCase()}_APPROVED`,
      afterState: expense,
    });

    await this.publisher.publish(new ExpenseApprovedEvent({
      expenseId: expense.id,
      approverId: context.userId,
      role,
    }));

    return expense;
  }
}
