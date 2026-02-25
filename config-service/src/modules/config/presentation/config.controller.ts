import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigManagementService } from '../application/config-management.service';
import { ConfigActivationService } from '../application/config-activation.service';
import * as DTO from '../dto/config.dto';
import { RbacGuard, Roles } from '@tripaxis/core';

@Controller('v1/config')
@UseGuards(RbacGuard)
export class ConfigController {
  constructor(
    private readonly configManager: ConfigManagementService,
    private readonly activationService: ConfigActivationService,
  ) {}

  @Get('active')
  async getActiveConfig() {
    return this.configManager.getActiveConfig();
  }

  // BR-050: Only SaaSAdmin or AppAdmin can modify config
  @Post('category')
  @Roles('SaaSAdmin', 'AppAdmin')
  async addCategory(@Body() dto: DTO.CreateCategoryDto) {
    return this.configManager.addCategory(dto);
  }

  @Post('sla')
  @Roles('SaaSAdmin', 'AppAdmin')
  async setSlaConfig(@Body() dto: DTO.CreateSlaConfigDto) {
    return this.configManager.setSlaConfig(dto);
  }

  @Post('activate/:versionId')
  @Roles('SaaSAdmin', 'AppAdmin')
  async activateVersion(@Param('versionId') versionId: string) {
    return this.activationService.activateVersion(versionId);
  }
}
