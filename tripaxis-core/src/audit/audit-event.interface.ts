export interface AuditEventPayload {
  entityId: string;
  entityType: string;
  action: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  metadata?: Record<string, any>;
}
