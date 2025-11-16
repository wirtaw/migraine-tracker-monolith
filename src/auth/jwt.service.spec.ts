import crypto from 'node:crypto';
import { Test } from '@nestjs/testing';
import { CustomJwtService as JwtService } from './jwt.service';
import { SymmetricKeyService } from './symmetric-key/symmetric-key.service';
import {
  UserPayloadWithKey,
  DecodedUserPayload,
} from './interfaces/auth.user.interface';
import jwt from 'jsonwebtoken';
import { Role } from './enums/roles.enum';

describe('CustomJwtService', () => {
  let jwtService: JwtService;
  let mockKeyService: Partial<SymmetricKeyService>;
  let keyService: SymmetricKeyService;
  const secretKey = 'test-secret-key-long';
  const normalizedKey = crypto.createHash('sha256').update(secretKey).digest();

  beforeEach(async () => {
    mockKeyService = {
      getKey: jest.fn().mockResolvedValue(secretKey),
    };

    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: SymmetricKeyService,
          useValue: mockKeyService,
        },
      ],
    }).compile();

    jwtService = module.get(JwtService);
    keyService = module.get(SymmetricKeyService);
  });

  it('should be defined', () => {
    expect(jwtService).toBeDefined();
    expect(keyService).toBeDefined();
  });

  describe('signPayload()', () => {
    it('should throw if key is missing from keyService', async () => {
      jest.spyOn(keyService, 'getKey').mockResolvedValue('');

      await expect(
        jwtService.signPayload(
          {
            userId: 'user123',
            email: 'test@mail.com',
            key: 'irrelevant',
            role: Role.USER,
          },
          '1h',
        ),
      ).rejects.toThrow(/Missing or invalid symmetric key/);
    });

    it('should throw if raw key is too short', async () => {
      jest.spyOn(keyService, 'getKey').mockResolvedValue('short');

      await expect(
        jwtService.signPayload(
          {
            userId: 'user123',
            email: 'test@mail.com',
            key: 'irrelevant',
            role: Role.USER,
          },
          '1h',
        ),
      ).rejects.toThrow(/Raw key too short/);
    });

    it('should sign payload and return a valid JWT', async () => {
      const payload: UserPayloadWithKey = {
        userId: 'user123',
        email: 'test@mail.com',
        key: crypto.randomBytes(32).toString('hex'),
        role: Role.GUEST,
      };

      const token = await jwtService.signPayload(payload, '6 h');

      expect(typeof token).toBe('string');
      expect(token.length).toBe(303);

      const decoded = jwt.decode(token) as DecodedUserPayload;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.key).toBe(payload.key);
    });
  });

  describe('verifyToken()', () => {
    it('should verify a valid token and return decoded payload', async () => {
      const payload: UserPayloadWithKey = {
        userId: 'user456',
        email: 'verify@mail.com',
        key: crypto.randomBytes(32).toString('hex'),
        role: Role.GUEST,
      };

      const token = jwt.sign(payload, normalizedKey, { expiresIn: 600 });

      const result = await jwtService.verifyToken(token);

      expect(result).toMatchObject({
        userId: payload.userId,
        email: payload.email,
        key: payload.key,
      });
      expect(result.exp).toBeDefined();
    });

    it('should throw error for invalid token', async () => {
      const invalidToken = 'invalid.token.value';

      await expect(jwtService.verifyToken(invalidToken)).rejects.toThrow(
        jwt.JsonWebTokenError,
      );
    });

    it('should throw error for expired token', async () => {
      const payload: UserPayloadWithKey = {
        userId: 'expiredUser',
        email: 'expired@mail.com',
        key: crypto.randomBytes(32).toString('hex'),
        role: Role.GUEST,
      };

      const expiredToken = jwt.sign(payload, normalizedKey, { expiresIn: -10 });

      await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow(
        jwt.TokenExpiredError,
      );
    });

    it('should throw if key is missing from keyService', async () => {
      jest.spyOn(keyService, 'getKey').mockResolvedValue('');

      const payload: UserPayloadWithKey = {
        userId: 'user456',
        email: 'verify@mail.com',
        key: crypto.randomBytes(32).toString('hex'),
        role: Role.GUEST,
      };

      const token = jwt.sign(payload, normalizedKey, { expiresIn: 600 });

      await expect(jwtService.verifyToken(token)).rejects.toThrow(
        /Missing or invalid symmetric key/,
      );
    });

    it('should throw if key is too short from keyService', async () => {
      jest.spyOn(keyService, 'getKey').mockResolvedValue('short');

      const payload: UserPayloadWithKey = {
        userId: 'user456',
        email: 'verify@mail.com',
        key: crypto.randomBytes(32).toString('hex'),
        role: Role.GUEST,
      };

      const token = jwt.sign(payload, normalizedKey, { expiresIn: 600 });

      await expect(jwtService.verifyToken(token)).rejects.toThrow(
        /Raw key too short/,
      );
    });
  });
});
