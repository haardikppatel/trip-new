import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextPayload {
  tenantId: string;
  userId: string;
  roles: string[];
  correlationId: string;
}

export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantContextPayload>();

  static run(payload: TenantContextPayload, callback: () => void) {
    this.storage.run(payload, callback);
  }

  static get(): TenantContextPayload | undefined {
    return this.storage.getStore();
  }

  static getOrThrow(): TenantContextPayload {
    const store = this.get();
    if (!store) {
      throw new Error('TenantContext is not initialized in this async scope');
    }
    return store;
  }

  static getTenantId(): string {
    return this.getOrThrow().tenantId;
  }

  static getCorrelationId(): string {
    return this.getOrThrow().correlationId;
  }
}
