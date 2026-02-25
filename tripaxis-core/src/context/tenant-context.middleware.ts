import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant-context';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId = 'UNKNOWN_TENANT';
    let userId = 'UNKNOWN_USER';
    let roles: string[] = [];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        
        tenantId = payload.tenant_id || tenantId;
        userId = payload.sub || userId;
        roles = payload.roles || [];
      } catch (e) {
        // Token parsing failed; auth guards will handle rejection later
      }
    }

    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    TenantContext.run({ tenantId, userId, roles, correlationId }, () => {
      next();
    });
  }
}
