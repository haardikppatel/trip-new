import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FinancialFlagController } from './presentation/financial-flag.controller';
import { FinancialFlagService } from './application/financial-flag.service';
import { PayableStateMachine } from './domain/payable-state-machine';
import { BillableStateMachine } from './domain/billable-state-machine';
import { FlagTransitionValidator } from './domain/flag-transition.validator';
import { FlagAuditWriter } from './infrastructure/flag-audit.writer';
import { PaymentEligibilityPublisher } from './infrastructure/payment-eligibility.publisher';
import { BillingEligibilityPublisher } from './infrastructure/billing-eligibility.publisher';
import { PayableSlaScheduler } from './application/payable-sla.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payable-sla',
    }),
  ],
  controllers: [FinancialFlagController],
  providers: [
    FinancialFlagService,
    PayableStateMachine,
    BillableStateMachine,
    FlagTransitionValidator,
    FlagAuditWriter,
    PaymentEligibilityPublisher,
    BillingEligibilityPublisher,
    PayableSlaScheduler,
  ],
})
export class FinancialFlagModule {}
