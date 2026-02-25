import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DuplicateEvaluationService } from '../application/duplicate-evaluation.service';

@Controller()
export class DuplicateConsumer {
  constructor(private readonly evaluationService: DuplicateEvaluationService) {}

  @EventPattern('ExpenseClaimSubmitted')
  async handleClaimSubmitted(@Payload() event: any) {
    // Event payload contains the full claim or we fetch it. Assuming full claim for this context.
    await this.evaluationService.evaluateClaim(event.claim, event.correlationId);
  }
}
