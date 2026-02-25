import { Module } from '@nestjs/common';
import { ExpenseController } from './presentation/expense.controller';
import { ExpenseConsumer } from './presentation/expense.consumer';
import { ExpenseService } from './application/expense.service';
import { AuditLogger, StructuredLogger } from '@tripaxis/core';

@Module({
  controllers: [ExpenseController, ExpenseConsumer],
  providers: [ExpenseService, AuditLogger, StructuredLogger],
})
export class ExpenseModule {}
