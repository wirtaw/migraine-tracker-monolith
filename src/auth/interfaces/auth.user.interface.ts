import { Request } from 'express';
import { Permission } from '../enums/permissions.enum';
import { Role } from '../enums/roles.enum';

export interface User {
  userId: string;
  username: string | undefined;
  permissions: Permission[];
  role: Role;
}

export interface RequestWithUser extends Request {
  user: User;
}
