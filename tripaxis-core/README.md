# @tripaxis/core

Shared utilities for TripAxis microservices.

## Installation

```bash
npm install @tripaxis/core
```

## Usage

### 1. OpenTelemetry Bootstrap
In your `main.ts` (before importing NestFactory):
```typescript
import { bootstrapOpenTelemetry } from '@tripaxis/core';

bootstrapOpenTelemetry({
  serviceName: 'travel-service',
  prometheusPort: 9464
});
```

### 2. Tenant Context Middleware
In your `app.module.ts`:
```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantContextMiddleware } from '@tripaxis/core';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
```

### 3. Structured Logger
In `main.ts`:
```typescript
import { StructuredLogger } from '@tripaxis/core';

const app = await NestFactory.create(AppModule, {
  logger: new StructuredLogger(),
});
```

### 4. RBAC Guard
```typescript
import { UseGuards, Controller, Get } from '@nestjs/common';
import { RbacGuard, Roles } from '@tripaxis/core';

@Controller('secure')
@UseGuards(RbacGuard)
export class SecureController {
  @Get()
  @Roles('Admin', 'TravelManager')
  getSecureData() {
    return 'Protected Data';
  }
}
```

### 5. Audit Logging
```typescript
import { Injectable } from '@nestjs/common';
import { AuditLogger } from '@tripaxis/core';

@Injectable()
export class MyService {
  constructor(private audit: AuditLogger) {}

  doAction() {
    this.audit.log({
      entityId: '123',
      entityType: 'TravelRequest',
      action: 'APPROVED',
      afterState: { status: 'APPROVED' }
    });
  }
}
```