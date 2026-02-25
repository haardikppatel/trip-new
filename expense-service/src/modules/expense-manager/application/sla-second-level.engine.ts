import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SLASecondLevelEngine {
  constructor(@InjectQueue('expense-manager-sla') private readonly slaQueue: Queue) {}

  async scheduleSLA(claimId: string, tenantId: string): Promise<void> {
    const deadlineMs = 72 * 3600 * 1000; // 72 hours SLA for Expense Manager
    const warningDelay = Math.floor(deadlineMs / 2);

    await this.slaQueue.add(
      'manager-sla-warning',
      { claimId, tenantId },
      { delay: warningDelay, jobId: `mgr-warning-${claimId}` }
    );

    // BR-020: Escalate to FinanceAdmin at expiry
    await this.slaQueue.add(
      'manager-sla-escalation',
      { claimId, tenantId },
      { delay: deadlineMs, jobId: `mgr-escalation-${claimId}` }
    );
  }

  async cancelSLA(claimId: string): Promise<void> {
    await this.slaQueue.remove(`mgr-warning-${claimId}`);
    await this.slaQueue.remove(`mgr-escalation-${claimId}`);
  }
}
