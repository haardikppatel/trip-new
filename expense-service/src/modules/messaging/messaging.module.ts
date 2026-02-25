import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventPublisher } from './event.publisher';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'expense_events_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [EventPublisher],
  exports: [EventPublisher],
})
export class MessagingModule {}
