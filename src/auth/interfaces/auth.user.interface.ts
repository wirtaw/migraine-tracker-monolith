import { Request } from 'express';
import { Permission } from '../enums/permissions.enum';
import { Role } from '../enums/roles.enum';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { JwtPayload } from 'jsonwebtoken';

export interface User {
  userId: string;
  username: string | undefined;
  permissions: Permission[];
  role: Role;
}

export interface RequestWithUser extends Request {
  user: SupabaseUser;
  session: {
    userId: string;
    key?: string;
  };
}

export interface UserPayload {
  userId: string;
  email?: string;
  role: Role;
}

export interface UserPayloadWithKey extends UserPayload {
  key: string;
}

export interface AuthResponse {
  message: string;
  user: UserPayload;
  token: string;
}

export interface DecodedUserPayload extends JwtPayload {
  userId: string;
  email: string;
  key: string;
}
