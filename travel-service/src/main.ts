import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { bootstrapOpenTelemetry, StructuredLogger } from '@tripaxis/core';

async function bootstrap() {
  // Initialize OpenTelemetry
  bootstrapOpenTelemetry({
    serviceName: 'travel-service',
    prometheusPort: 9464,
  });

  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });

  // OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Travel Service API')
    .setDescription('TripAxis Travel Service REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
