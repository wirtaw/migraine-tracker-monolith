// src/auth/jwt.service.ts
import { Injectable } from '@nestjs/common';
import { SymmetricKeyService } from './symmetric-key.service';
import * as jwt from 'jsonwebtoken';
import { RequestWithUser } from './interfaces/auth.user.interface';

@Injectable()
export class JwtService {
  constructor(private readonly keyService: SymmetricKeyService) {}

  async verifyToken(token: string): Promise<any> {
    const key = await this.keyService.getKey();
    return jwt.verify(token, key);
  }

  async signPayload(payload: RequestWithUser): Promise<string> {
    const key = await this.keyService.getKey();
    return jwt.sign(payload, key, { expiresIn: '1h' });
  }
}
