import { Request } from 'express';
import { Permission } from '../enums/permissions.enum';
import { Role } from '../enums/roles.enum';
import { type User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  userId: string;
  username: string | undefined;
  permissions: Permission[];
  role: Role;
}

export interface RequestWithUser extends Request {
  user: SupabaseUser;
}

export interface UserPayload {
  userId: string;
  email?: string;
}

export interface UserPayloadWithKey extends UserPayload {
  key: string;
}

export interface AuthResponse {
  message: string;
  user: UserPayload;
  token: string;
}
