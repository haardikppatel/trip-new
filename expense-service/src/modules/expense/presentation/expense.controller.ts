import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpenseService } from '../application/expense.service';
import { RbacGuard, Roles } from '@tripaxis/core';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('v1/expenses')
@UseGuards(RbacGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post('submit')
  @Roles('Employee', 'Manager')
  @ApiOperation({ summary: 'Submit a new expense' })
  async submit(@Body() body: { idempotencyKey: string; totalAmount: number; currency: string }) {
    return this.expenseService.submitExpense(body.idempotencyKey, body.totalAmount, body.currency);
  }

  @Post(':id/approve/manager')
  @Roles('Manager')
  @ApiOperation({ summary: 'Approve expense as Manager' })
  async approveManager(@Param('id') id: string) {
    return this.expenseService.approveExpense(id, 'Manager');
  }

  @Post(':id/approve/finance')
  @Roles('Finance')
  @ApiOperation({ summary: 'Approve expense as Finance' })
  async approveFinance(@Param('id') id: string) {
    return this.expenseService.approveExpense(id, 'Finance');
  }
}
