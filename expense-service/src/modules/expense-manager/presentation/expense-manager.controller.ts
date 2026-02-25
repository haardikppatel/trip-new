import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ExpenseManagerService } from '../application/expense-manager.service';
import { FinalApproveDto, FinalRejectDto, OverrideFlagDto } from '../dto/expense-manager.dto';
import { RbacGuard, Roles } from '@tripaxis/core';

@Controller('v1/expense-manager')
@UseGuards(RbacGuard)
export class ExpenseManagerController {
  constructor(private readonly expenseManagerService: ExpenseManagerService) {}

  @Get('queue')
  @Roles('ExpenseManager', 'FinanceAdmin')
  async getQueue() {
    return this.expenseManagerService.getPendingReviews();
  }

  @Post(':claimId/approve')
  @Roles('ExpenseManager', 'FinanceAdmin')
  async approve(@Param('claimId') claimId: string, @Body() dto: FinalApproveDto) {
    return this.expenseManagerService.approveClaim(claimId, dto);
  }

  @Post(':claimId/reject')
  @Roles('ExpenseManager', 'FinanceAdmin')
  async reject(@Param('claimId') claimId: string, @Body() dto: FinalRejectDto) {
    return this.expenseManagerService.rejectClaim(claimId, dto);
  }

  @Put(':claimId/line-items/:lineItemId/payable')
  @Roles('ExpenseManager', 'FinanceAdmin')
  async overridePayable(
    @Param('claimId') claimId: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: OverrideFlagDto
  ) {
    return this.expenseManagerService.overridePayable(claimId, lineItemId, dto);
  }

  @Put(':claimId/line-items/:lineItemId/billable')
  @Roles('ExpenseManager', 'FinanceAdmin')
  async overrideBillable(
    @Param('claimId') claimId: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: OverrideFlagDto
  ) {
    return this.expenseManagerService.overrideBillable(claimId, lineItemId, dto);
  }
}
