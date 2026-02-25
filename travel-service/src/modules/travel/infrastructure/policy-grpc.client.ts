import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

interface PolicyValidationRequest {
  tenantId: string;
  userId: string;
  destination: string;
  estimatedCost: number;
  currency: string;
}

interface PolicyValidationResponse {
  isValid: boolean;
  violations: string[];
  snapshotId: string;
}

interface PolicyServiceGrpc {
  validateTravelPolicy(data: PolicyValidationRequest): import('rxjs').Observable<PolicyValidationResponse>;
}

@Injectable()
export class PolicyGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'policy',
      protoPath: join(__dirname, '../../protos/policy.proto'),
      url: process.env.POLICY_SERVICE_URL || 'localhost:50051',
    },
  })
  private client!: ClientGrpc;

  private policyService!: PolicyServiceGrpc;

  onModuleInit() {
    this.policyService = this.client.getService<PolicyServiceGrpc>('PolicyService');
  }

  async validatePolicy(request: PolicyValidationRequest): Promise<PolicyValidationResponse> {
    return firstValueFrom(this.policyService.validateTravelPolicy(request));
  }
}
