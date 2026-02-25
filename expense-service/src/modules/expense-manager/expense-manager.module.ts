import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExpenseManagerController } from './presentation/expense-manager.controller';
import { ExpenseManagerService } from './application/expense-manager.service';
import { ComplianceValidationEngine } from './domain/compliance-validation.engine';
import { PayableOverrideHandler } from './domain/payable-override.handler';
import { BillableFlagEditor } from './domain/billable-flag.editor';
import { ApprovalFinalizationService } from './application/approval-finalization.service';
import { SLASecondLevelEngine } from './application/sla-second-level.engine';
import { AuditTrailWriter } from './infrastructure/audit-trail.writer';
import { ExpenseManagerEventPublisher } from './infrastructure/expense-manager-event.publisher';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'expense-manager-sla',
    }),
  ],
  controllers: [ExpenseManagerController],
  providers: [
    ExpenseManagerService,
    ComplianceValidationEngine,
    PayableOverrideHandler,
    BillableFlagEditor,
    ApprovalFinalizationService,
    SLASecondLevelEngine,
    AuditTrailWriter,
    ExpenseManagerEventPublisher,
  ],
})
export class ExpenseManagerModule {}
