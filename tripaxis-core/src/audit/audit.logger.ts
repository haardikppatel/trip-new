import { Injectable } from '@nestjs/common';
import { StructuredLogger } from '../logger/structured.logger';
import { TenantContext } from '../context/tenant-context';
import { AuditEventPayload } from './audit-event.interface';

@Injectable()
export class AuditLogger {
  constructor(private readonly logger: StructuredLogger) {
    this.logger.setContext(AuditLogger.name);
  }

  /**
   * Emits an append-only audit record.
   * In a real implementation, this could also push to an EventStore or DB.
   */
  log(payload: AuditEventPayload): void {
    const context = TenantContext.getOrThrow();
    
    const auditRecord = {
      auditType: 'IMMUTABLE_RECORD',
      tenantId: context.tenantId,
      actorId: context.userId,
      correlationId: context.correlationId,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // Output as structured JSON for log aggregators (e.g., Datadog, ELK)
    this.logger.log(auditRecord);
  }
}
