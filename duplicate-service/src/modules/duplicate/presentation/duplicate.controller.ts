import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DuplicateEvaluationService } from '../application/duplicate-evaluation.service';
import { RbacGuard, Roles, TenantContext } from '@tripaxis/core';

@Controller('v1/duplicate-evaluations')
@UseGuards(RbacGuard)
export class DuplicateController {
  constructor(private readonly evaluationService: DuplicateEvaluationService) {}

  @Post('evaluate')
  @Roles('System')
  async evaluateClaim(@Body() claim: any) {
    const context = TenantContext.getOrThrow();
    await this.evaluationService.evaluateClaim(claim, context.correlationId);
    return { success: true };
  }

  @Get('history/:claimId')
  @Roles('ExpenseManager', 'FinanceAdmin')
  async getHistory(@Param('claimId') claimId: string) {
    const context = TenantContext.getOrThrow();
    return this.evaluationService.getHistory(claimId, context.tenantId);
  }
}
