import { IsString, IsOptional, IsBoolean, MinLength, IsNotEmpty } from 'class-validator';

export class FinalApproveDto {
  @IsOptional()
  @IsString()
  complianceNotes?: string;

  @IsOptional()
  @IsString()
  justification?: string; // Required if duplicate_detected = true
}

export class FinalRejectDto {
  @IsString()
  @MinLength(10, { message: 'BR-019: Rejection reason must be at least 10 characters' })
  reason: string;
}

export class OverrideFlagDto {
  @IsBoolean()
  newValue: boolean;

  @IsString()
  @IsNotEmpty({ message: 'BR-015: Override reason is required' })
  reason: string;
}
