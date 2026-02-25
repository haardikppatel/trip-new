import { IsString, IsNumber, IsBoolean, IsObject, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsObject()
  rules: {
    requiresReceipt: boolean;
    maxAmountPerClaim?: number;
    maxAmountPerDay?: number;
    currencyScope: string;
    autoBillable: boolean;
    taxable: boolean;
  };

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreatePolicyDto {
  @IsString()
  ruleType: string;

  @IsObject()
  ruleConfig: Record<string, any>;
}

export class CreateSlaConfigDto {
  @IsNumber()
  managerHours: number;

  @IsNumber()
  financeHours: number;

  @IsNumber()
  payableDays: number;

  @IsObject()
  escalationRoles: Record<string, string>;
}

export class CreateDuplicateConfigDto {
  @IsNumber()
  threshold: number;

  @IsObject()
  ruleWeights: Record<string, number>;
}

export class CreateBillingConfigDto {
  @IsNumber()
  taxPercentage: number;

  @IsString()
  billingCycle: string;

  @IsString()
  invoicePrefix: string;
}

export class CreatePaymentConfigDto {
  @IsString()
  autoSchedule: string;

  @IsNumber()
  retryAttempts: number;

  @IsString()
  backoffStrategy: string;
}
