import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentController } from './presentation/payment.controller';
import { PaymentRunService } from './application/payment-run.service';
import { PaymentCallbackService } from './application/payment-callback.service';
import { PaymentRetryScheduler } from './application/payment-retry.scheduler';
import { RedisLockService } from './infrastructure/redis-lock.service';
import { MockPaymentAdapter } from './infrastructure/mock-payment.adapter';
import { PaymentEventPublisher } from './infrastructure/payment-event.publisher';
import { Redis } from 'ioredis';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payment-retry',
    }),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentRunService,
    PaymentCallbackService,
    PaymentRetryScheduler,
    RedisLockService,
    PaymentEventPublisher,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
    },
    {
      provide: 'PaymentGatewayAdapter',
      useClass: MockPaymentAdapter,
    },
  ],
})
export class PaymentModule {}
