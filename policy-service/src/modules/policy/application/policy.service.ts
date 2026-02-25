import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventPublisher } from '../../messaging/event.publisher';
import { PolicyUpdatedEvent } from '../domain/events/policy-updated.event';
import { StructuredLogger } from '@tripaxis/core';

export interface PolicyValidationRequest {
  tenantId: string;
  userId: string;
  destination: string;
  estimatedCost: number;
  currency: string;
}

export interface PolicyValidationResponse {
  isValid: boolean;
  violations: string[];
  snapshotId: string;
}

@Injectable()
export class PolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly logger: StructuredLogger,
  ) {
    this.logger.setContext(PolicyService.name);
  }

  async validateTravelPolicy(request: PolicyValidationRequest): Promise<PolicyValidationResponse> {
    this.logger.log(`Validating policy for tenant ${request.tenantId}`);

    // 1. Fetch current policy rules for tenant
    const policyVersion = await this.prisma.policyVersion.findFirst({
      where: {
        tenantId: request.tenantId,
        isCurrent: true,
        policy: { isActive: true },
      },
      include: { policy: true },
    });

    if (!policyVersion) {
      // If no policy exists, default to valid (or invalid depending on business rules)
      return { isValid: true, violations: [], snapshotId: 'NO_POLICY' };
    }

    const rules = policyVersion.rules as any;
    const violations: string[] = [];

    // 2. Deterministic Rule Evaluation
    if (rules.maxAmount && request.estimatedCost > rules.maxAmount) {
      violations.push(`Estimated cost exceeds maximum allowed amount of ${rules.maxAmount}`);
    }

    if (rules.restrictedRegions && rules.restrictedRegions.includes(request.destination)) {
      violations.push(`Destination ${request.destination} is restricted`);
    }

    // 3. Generate Snapshot
    const snapshot = await this.prisma.withTenantContext(request.tenantId, async (tx) => {
      return tx.policySnapshot.create({
        data: {
          tenantId: request.tenantId,
          policyVersionId: policyVersion.id,
          snapshotData: rules,
        },
      });
    });

    return {
      isValid: violations.length === 0,
      violations,
      snapshotId: snapshot.id,
    };
  }
}
