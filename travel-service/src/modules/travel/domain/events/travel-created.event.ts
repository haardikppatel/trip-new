import { BaseDomainEvent } from '@tripaxis/core';

export interface TravelCreatedPayload {
  travelRequestId: string;
  userId: string;
  destination: string;
  estimatedCost: number;
  currency: string;
  policySnapshotId?: string;
}

export class TravelCreatedEvent extends BaseDomainEvent<TravelCreatedPayload> {
  constructor(payload: TravelCreatedPayload) {
    super('TravelCreated', payload);
  }
}
