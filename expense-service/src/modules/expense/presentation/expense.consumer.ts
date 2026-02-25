import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StructuredLogger } from '@tripaxis/core';

@Controller()
export class ExpenseConsumer {
  constructor(private readonly logger: StructuredLogger) {
    this.logger.setContext(ExpenseConsumer.name);
  }

  @EventPattern('TravelCreated')
  async handleTravelCreated(@Payload() data: any) {
    this.logger.log(`Received TravelCreated event: ${JSON.stringify(data)}`);
    // Logic to pre-populate expense drafts could go here
  }
}
