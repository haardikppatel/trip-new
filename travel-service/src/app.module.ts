import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TenantContextMiddleware } from '@tripaxis/core';
import { TravelModule } from './modules/travel/travel.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    PrismaModule,
    MessagingModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    TravelModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
