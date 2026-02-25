import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PayableSlaScheduler {
  constructor(@InjectQueue('payable-sla') private readonly slaQueue: Queue) {}

  async scheduleSlaAlert(claimId: string, tenantId: string, delayDays: number = 5): Promise<void> {
    const delayMs = delayDays * 24 * 3600 * 1000;
    await this.slaQueue.add(
      'payable-delay-alert',
      { claimId, tenantId },
      { delay: delayMs, jobId: `payable-sla-${claimId}` }
    );
  }

  async cancelSlaAlert(claimId: string): Promise<void> {
    await this.slaQueue.remove(`payable-sla-${claimId}`);
  }
}
