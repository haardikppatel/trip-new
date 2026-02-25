import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { bootstrapOpenTelemetry, StructuredLogger } from '@tripaxis/core';

async function bootstrap() {
  bootstrapOpenTelemetry({
    serviceName: 'policy-service',
    prometheusPort: 9465,
  });

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'policy',
      protoPath: join(__dirname, 'protos/policy.proto'),
      url: '0.0.0.0:50051',
    },
    logger: new StructuredLogger(),
  });

  await app.listen();
}
bootstrap();
