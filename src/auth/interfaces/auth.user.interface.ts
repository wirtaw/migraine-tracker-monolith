import { Request } from 'express';

export interface User {
  userId: string;
  username: string;
}

export interface RequestWithUser extends Request {
  user: User;
}
