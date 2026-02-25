import { Controller, Put, Body, Param, UseGuards } from '@nestjs/common';
import { FinancialFlagService } from '../application/financial-flag.service';
import { UpdatePayableStatusDto, UpdateBillableStatusDto } from '../dto/financial-flag.dto';
import { RbacGuard, Roles } from '@tripaxis/core';

@Controller('v1/financial-flags')
@UseGuards(RbacGuard)
export class FinancialFlagController {
  constructor(private readonly financialFlagService: FinancialFlagService) {}

  @Put(':claimId/payable')
  @Roles('FinanceAdmin', 'System')
  async updatePayableStatus(
    @Param('claimId') claimId: string,
    @Body() dto: UpdatePayableStatusDto
  ) {
    return this.financialFlagService.updatePayableStatus(claimId, dto);
  }

  @Put(':claimId/billable')
  @Roles('FinanceAdmin', 'System')
  async updateBillableStatus(
    @Param('claimId') claimId: string,
    @Body() dto: UpdateBillableStatusDto
  ) {
    return this.financialFlagService.updateBillableStatus(claimId, dto);
  }
}
