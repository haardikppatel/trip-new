import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ConfigEventPublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  publishConfigActivated(tenantId: string, versionId: string): void {
    this.client.emit('ConfigActivated', {
      tenantId,
      versionId,
      activatedAt: new Date().toISOString(),
    });
  }

  publishPolicyUpdated(tenantId: string, versionId: string, changedDomain: string): void {
    this.client.emit('PolicyUpdated', {
      tenantId,
      versionId,
      changedDomain,
      timestamp: new Date().toISOString(),
    });
  }
}
