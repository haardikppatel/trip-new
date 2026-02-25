import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ConfigAuditWriter {
  constructor(private readonly prisma: PrismaService) {}

  async logChange(
    tenantId: string,
    versionId: string,
    changeType: string,
    changedBy: string,
    tx?: any
  ): Promise<void> {
    const db = tx || this.prisma;

    // Append-only audit log
    await db.configAudit.create({
      data: {
        tenantId,
        versionId,
        changeType,
        changedBy,
      }
    });
  }
}
