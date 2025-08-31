import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { Permission } from '../enums/permissions.enum';
import { RequestWithUser } from '../interfaces/auth.user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const hasPermission = requiredPermissions.every((p) =>
      req.user?.permissions?.includes(p),
    );

    return hasPermission;
  }
}
