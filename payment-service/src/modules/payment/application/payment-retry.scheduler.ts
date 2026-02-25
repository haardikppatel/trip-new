import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PaymentRetryScheduler {
  constructor(@InjectQueue('payment-retry') private readonly retryQueue: Queue) {}

  async scheduleRetry(claimId: string, tenantId: string, attempt: number = 1): Promise<void> {
    // BR-035: Exponential backoff retry
    const maxRetries = 3;
    if (attempt > maxRetries) return;

    const delayMs = Math.pow(2, attempt) * 3600 * 1000; // 2h, 4h, 8h
    await this.retryQueue.add(
      'retry-payment',
      { claimId, tenantId, attempt },
      { delay: delayMs, jobId: `retry-${claimId}-${attempt}` }
    );
  }

  async scheduleDailyRun(tenantId: string): Promise<void> {
    await this.retryQueue.add(
      'daily-payment-run',
      { tenantId },
      { repeat: { pattern: '0 2 * * *' }, jobId: `daily-run-${tenantId}` } // 2 AM daily
    );
  }
}
