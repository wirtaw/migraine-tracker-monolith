// src/auth/jwt.service.ts
import { Injectable } from '@nestjs/common';
import type { StringValue } from 'ms';
import { SymmetricKeyService } from './symmetric-key/symmetric-key.service';
import jwt from 'jsonwebtoken';
import {
  DecodedUserPayload,
  UserPayloadWithKey,
} from './interfaces/auth.user.interface';

@Injectable()
export class CustomJwtService {
  constructor(private readonly keyService: SymmetricKeyService) {}

  async verifyToken(token: string): Promise<DecodedUserPayload> {
    const key = await this.keyService.getKey('JWT_SECRET');
    return jwt.verify(token, key) as DecodedUserPayload;
  }

  async signPayload(
    payload: UserPayloadWithKey,
    expiresIn: StringValue,
  ): Promise<string> {
    const key = await this.keyService.getKey('JWT_SECRET');
    return jwt.sign(payload, key, { expiresIn });
  }
}
