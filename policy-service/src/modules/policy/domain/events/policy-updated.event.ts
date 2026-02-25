import { BaseDomainEvent } from '@tripaxis/core';

export interface PolicyUpdatedPayload {
  policyId: string;
  version: number;
}

export class PolicyUpdatedEvent extends BaseDomainEvent<PolicyUpdatedPayload> {
  constructor(payload: PolicyUpdatedPayload) {
    super('PolicyUpdated', payload);
  }
}
