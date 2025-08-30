// src/auth/supabase.service.ts
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthConfig } from '../../config/auth/auth.config';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient;
  private readonly authConfig: AuthConfig | undefined;

  constructor(configService: ConfigService) {
    this.authConfig = configService.get<AuthConfig>('auth');

    this.supabaseClient =
      this.authConfig?.supaBaseUrl && this.authConfig?.supaBaseAnonKey
        ? createClient(
            this.authConfig.supaBaseUrl,
            this.authConfig.supaBaseAnonKey,
          )
        : ({} as SupabaseClient);
  }

  get client(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new InternalServerErrorException(
        'Supabase client not initialized.',
      );
    }
    return this.supabaseClient;
  }

  async getUser(token: string): Promise<User> {
    if (!token) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    const { data, error } = await this.client.auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return data.user;
  }
}
