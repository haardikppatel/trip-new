import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseDomainEvent } from '@tripaxis/core';

@Injectable()
export class EventPublisher {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  async publish(event: BaseDomainEvent): Promise<void> {
    this.client.emit(event.eventName, event.serialize());
  }
}
