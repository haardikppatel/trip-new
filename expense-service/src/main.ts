import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { bootstrapOpenTelemetry, StructuredLogger } from '@tripaxis/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  bootstrapOpenTelemetry({
    serviceName: 'expense-service',
    prometheusPort: 9466,
  });

  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });

  // Connect RabbitMQ Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'expense_events_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Expense Service API')
    .setDescription('TripAxis Expense Service REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();
