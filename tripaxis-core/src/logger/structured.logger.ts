import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { TenantContext } from '../context/tenant-context';

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger extends ConsoleLogger {
  protected printMessages(messages: unknown[], context?: string, logLevel?: string, writeStreamType?: 'stdout' | 'stderr') {
    let correlationId = 'N/A';
    let tenantId = 'N/A';
    
    const store = TenantContext.get();
    if (store) {
      correlationId = store.correlationId;
      tenantId = store.tenantId;
    }

    messages.forEach((message) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: logLevel?.toUpperCase() || 'INFO',
        context: context || this.context,
        correlationId,
        tenantId,
        message: typeof message === 'object' ? message : { text: message },
      };
      
      const stream = writeStreamType === 'stderr' ? process.stderr : process.stdout;
      stream.write(JSON.stringify(logEntry) + '\n');
    });
  }
}
