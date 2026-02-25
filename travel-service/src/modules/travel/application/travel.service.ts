import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventPublisher } from '../../messaging/event.publisher';
import { PolicyGrpcClient } from '../infrastructure/policy-grpc.client';
import { TravelCreatedEvent } from '../domain/events/travel-created.event';
import { CreateTravelDto } from '../presentation/dto/create-travel.dto';
import { TenantContext, AuditLogger } from '@tripaxis/core';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TravelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly policyClient: PolicyGrpcClient,
    private readonly auditLogger: AuditLogger,
    @InjectQueue('travel-sla') private slaQueue: Queue,
  ) {}

  async createTravelRequest(dto: CreateTravelDto) {
    const context = TenantContext.getOrThrow();

    // 1. Validate Policy via gRPC
    const policyResult = await this.policyClient.validatePolicy({
      tenantId: context.tenantId,
      userId: context.userId,
      destination: dto.destination,
      estimatedCost: dto.estimatedCost,
      currency: dto.currency || 'USD',
    });

    if (!policyResult.isValid) {
      throw new BadRequestException({
        message: 'Policy validation failed',
        violations: policyResult.violations,
      });
    }

    // 2. Create Request in DB (with RLS context)
    const travelRequest = await this.prisma.withTenantContext(async (tx) => {
      const request = await tx.travelRequest.create({
        data: {
          tenantId: context.tenantId,
          userId: context.userId,
          destination: dto.destination,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          purpose: dto.purpose,
          estimatedCost: dto.estimatedCost,
          currency: dto.currency || 'USD',
          status: 'PENDING',
        },
      });

      // 3. Immutable Audit Log
      await tx.travelAuditLog.create({
        data: {
          travelRequestId: request.id,
          tenantId: context.tenantId,
          actorId: context.userId,
          action: 'CREATED',
          afterState: JSON.parse(JSON.stringify(request)),
        },
      });

      return request;
    });

    // 4. Structured Audit Logging
    this.auditLogger.log({
      entityId: travelRequest.id,
      entityType: 'TravelRequest',
      action: 'CREATED',
      afterState: travelRequest,
    });

    // 5. Publish Domain Event
    const event = new TravelCreatedEvent({
      travelRequestId: travelRequest.id,
      userId: travelRequest.userId,
      destination: travelRequest.destination,
      estimatedCost: Number(travelRequest.estimatedCost),
      currency: travelRequest.currency,
      policySnapshotId: policyResult.snapshotId,
    });
    await this.publisher.publish(event);

    // 6. Schedule SLA Timer (e.g., auto-escalate if not approved in 48h)
    await this.slaQueue.add(
      'check-approval-sla',
      { travelRequestId: travelRequest.id, tenantId: context.tenantId },
      { delay: 48 * 60 * 60 * 1000 } // 48 hours
    );

    return travelRequest;
  }
}
