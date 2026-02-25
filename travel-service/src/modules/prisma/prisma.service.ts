import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@tripaxis/core';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // RLS Extension: Inject tenant_id into transaction context
  async withTenantContext<T>(
    operation: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    const context = TenantContext.getOrThrow();
    
    return this.$transaction(async (tx) => {
      // Enforce RLS by setting the local variable for the transaction
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${context.tenantId}, true)`;
      return operation(tx);
    });
  }
}
