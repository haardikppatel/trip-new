import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { RuleConfigService } from './application/rule-config.service';
import { RiskConfigManagerService } from './application/risk-config-manager.service';
import { RbacGuard, Roles, TenantContext } from '@tripaxis/core';

@Controller('v1/risk-config')
@UseGuards(RbacGuard)
export class RiskConfigController {
  constructor(
    private readonly configService: RuleConfigService,
    private readonly configManager: RiskConfigManagerService,
  ) {}

  @Get()
  @Roles('FinanceAdmin')
  async getConfig() {
    const context = TenantContext.getOrThrow();
    return this.configService.getActiveRules(context.tenantId);
  }

  @Put()
  @Roles('FinanceAdmin')
  async updateConfig(@Body() body: { ruleName: string; weight: number; active: boolean }) {
    return this.configManager.updateConfig(body.ruleName, body.weight, body.active);
  }
}
