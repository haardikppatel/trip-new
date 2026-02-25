import { v4 as uuidv4 } from 'uuid';
import { TenantContext } from '../context/tenant-context';

export abstract class BaseDomainEvent<T = any> {
  public readonly eventId: string;
  public readonly timestamp: string;
  public readonly eventName: string;
  public readonly version: string;
  public readonly correlationId: string;
  public readonly tenantId: string;
  public readonly payload: T;

  constructor(eventName: string, payload: T, version: string = '1.0') {
    this.eventId = uuidv4();
    this.timestamp = new Date().toISOString();
    this.eventName = eventName;
    this.version = version;
    this.payload = payload;

    const context = TenantContext.get();
    this.tenantId = context?.tenantId || 'SYSTEM';
    this.correlationId = context?.correlationId || uuidv4();
  }

  serialize(): string {
    return JSON.stringify({
      eventId: this.eventId,
      timestamp: this.timestamp,
      eventName: this.eventName,
      version: this.version,
      correlationId: this.correlationId,
      tenantId: this.tenantId,
      payload: this.payload,
    });
  }
}
