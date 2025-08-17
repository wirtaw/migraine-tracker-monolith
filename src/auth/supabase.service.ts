// src/auth/supabase.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient =
      process.env?.SUPABASE_URL && process.env?.SUPABASE_KEY
        ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
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
}
