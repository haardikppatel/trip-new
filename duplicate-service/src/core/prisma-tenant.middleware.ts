import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@tripaxis/core';

export function getTenantAwarePrismaClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const context = TenantContext.get();
          if (context?.tenantId) {
            args.where = { ...args.where, tenantId: context.tenantId };
          }
          return query(args);
        },
      },
    },
  });
}
