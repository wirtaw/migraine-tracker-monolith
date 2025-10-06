// src/auth/jwt.service.ts
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
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
    const rawKey = await this.keyService.getKey('JWT_SECRET');

    if (!rawKey) {
      throw new Error('Missing or invalid symmetric key');
    }

    if (rawKey.length < 16) {
      throw new Error(`Raw key too short: ${rawKey.length} characters`);
    }

    const normalizedKey = createHash('sha256').update(rawKey).digest();

    return jwt.verify(token, normalizedKey) as DecodedUserPayload;
  }

  async signPayload(
    payload: UserPayloadWithKey,
    expiresIn: StringValue,
  ): Promise<string> {
    const rawKey = await this.keyService.getKey('JWT_SECRET');

    if (!rawKey) {
      throw new Error('Missing or invalid symmetric key');
    }

    if (rawKey.length < 16) {
      throw new Error(`Raw key too short: ${rawKey.length} characters`);
    }

    const normalizedKey = createHash('sha256').update(rawKey).digest();

    return jwt.sign(payload, normalizedKey, { expiresIn });
  }
}
