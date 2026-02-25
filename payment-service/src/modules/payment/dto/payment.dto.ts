import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class TriggerPaymentRunDto {
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}

export class PaymentCallbackDto {
  @IsString()
  @IsNotEmpty()
  externalTransactionId: string;

  @IsString()
  @IsNotEmpty()
  claimId: string;

  @IsString()
  @IsNotEmpty()
  status: 'SUCCESS' | 'FAILED';

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsOptional()
  @IsString()
  failureReason?: string;
}
