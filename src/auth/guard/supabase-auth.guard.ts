// src/auth/guards/supabase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';
import { RequestWithUser, User } from '../interfaces/auth.user.interface';
import { ErrorExceptionLogging } from '../../utils/error.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/roles.enum';
import { Permission } from '../enums/permissions.enum';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabaseService.client.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Zakładamy, że role są przechowywane w user.user_metadata.role
      const userRole = (user.user_metadata?.role as Role) || Role.USER;
      const userPermissions = (user.user_metadata
        ?.permission as Permission[]) || [Permission.READ_MIGRAINE];

      request.user = {
        userId: user.id,
        username: user.email,
        roles: [userRole],
        permissions: userPermissions,
      } as User;

      // RBAC — sprawdzamy wymagane role
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles && !requiredRoles.includes(userRole)) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      ErrorExceptionLogging(error, SupabaseAuthGuard.name);
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
