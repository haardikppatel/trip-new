import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { PayableStatus, BillableStatus } from '@prisma/client';

export class UpdatePayableStatusDto {
  @IsEnum(PayableStatus)
  status: PayableStatus;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  paymentReferenceId?: string;

  @IsOptional()
  @IsString()
  financeOverrideReason?: string;
}

export class UpdateBillableStatusDto {
  @IsEnum(BillableStatus)
  status: BillableStatus;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  invoiceReferenceId?: string;
}
