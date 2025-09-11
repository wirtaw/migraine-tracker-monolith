// src/auth/guard/rbac.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '../enums/roles.enum';
import { Permission } from '../enums/permissions.enum';
import { RequestWithUser } from '../interfaces/auth.user.interface';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const isSwagger = request.url?.startsWith('/docs');
    const isSwaggerAsset =
      request.url?.startsWith('/docs/') || request.url === '/docs';

    if (isSwagger || isSwaggerAsset) return true;

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Missing token');

    const {
      data: { user },
      error,
    } = await this.supabaseService.client.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Invalid token');

    const role = (user.user_metadata?.role as Role) || Role.USER;
    const permissions = (user.user_metadata?.permissions as Permission[]) || [];

    request.user = {
      id: user.id,
      userId: user.id,
      username: user.email,
      role,
      permissions,
      app_metadata: user?.app_metadata,
      user_metadata: user?.user_metadata,
      aud: user.aud,
      created_at: user.created_at,
    } as User;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient role');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const hasAllPermissions = requiredPermissions?.every((p) =>
      permissions.includes(p),
    );
    if (requiredPermissions && !hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
