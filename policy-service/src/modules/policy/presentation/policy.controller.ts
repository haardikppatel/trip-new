import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PolicyService, PolicyValidationRequest, PolicyValidationResponse } from '../application/policy.service';

@Controller()
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @GrpcMethod('PolicyService', 'ValidateTravelPolicy')
  async validateTravelPolicy(data: PolicyValidationRequest): Promise<PolicyValidationResponse> {
    return this.policyService.validateTravelPolicy(data);
  }
}
