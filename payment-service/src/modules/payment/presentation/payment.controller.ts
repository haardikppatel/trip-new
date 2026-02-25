import { Controller, Post, Get, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { PaymentRunService } from '../application/payment-run.service';
import { PaymentCallbackService } from '../application/payment-callback.service';
import { TriggerPaymentRunDto, PaymentCallbackDto } from '../dto/payment.dto';
import { RbacGuard, Roles, TenantContext } from '@tripaxis/core';

@Controller('v1/payments')
export class PaymentController {
  constructor(
    private readonly paymentRunService: PaymentRunService,
    private readonly callbackService: PaymentCallbackService,
  ) {}

  @Post('run')
  @UseGuards(RbacGuard)
  @Roles('FinanceAdmin')
  async triggerPaymentRun(@Body() dto: TriggerPaymentRunDto) {
    return this.paymentRunService.triggerPaymentRun(dto.idempotencyKey);
  }

  @Get('run/:runId')
  @UseGuards(RbacGuard)
  @Roles('FinanceAdmin')
  async getRunDetails(@Param('runId') runId: string) {
    return this.paymentRunService.getRunDetails(runId);
  }

  @Post('callback')
  async handleCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-signature') signature: string,
    @Body() dto: PaymentCallbackDto
  ) {
    // Webhook endpoint, tenantId extracted from headers or payload
    return this.callbackService.handleCallback(tenantId, dto, signature);
  }
}
