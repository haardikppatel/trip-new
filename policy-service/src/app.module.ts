import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PolicyModule } from './modules/policy/policy.module';
import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    PrismaModule,
    MessagingModule,
    PolicyModule,
  ],
})
export class AppModule {}
