// src/auth/supabase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { RequestWithUser } from './interfaces/auth.user.interface';
import { User } from './interfaces/auth.user.interface';
import { ErrorExceptionLogging } from '../utils/error.exception';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabaseService.client.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException();
      }

      request.user = { userId: user.id, username: user.email } as User;
    } catch (error) {
      ErrorExceptionLogging(error, SupabaseAuthGuard.name);
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
