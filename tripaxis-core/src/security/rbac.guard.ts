import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from '../context/tenant-context';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const tenantContext = TenantContext.get();
    if (!tenantContext) {
      throw new ForbiddenException('Tenant context missing');
    }

    const hasRole = requiredRoles.some((role) => tenantContext.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions for this resource');
    }

    return true;
  }
}
