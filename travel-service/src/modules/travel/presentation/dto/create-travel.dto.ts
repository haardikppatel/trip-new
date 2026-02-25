import { IsString, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTravelDto {
  @ApiProperty({ example: 'New York, USA' })
  @IsString()
  destination!: string;

  @ApiProperty({ example: '2024-12-01T00:00:00Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2024-12-05T00:00:00Z' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 'Annual Tech Conference' })
  @IsString()
  purpose!: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  estimatedCost!: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
