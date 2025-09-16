import { CustomJwtService } from './jwt.service';
import { SymmetricKeyService } from './symmetric-key/symmetric-key.service';
import {
  UserPayloadWithKey,
  DecodedUserPayload,
} from './interfaces/auth.user.interface';
import jwt from 'jsonwebtoken';
import { Role } from './enums/roles.enum';

describe('CustomJwtService', () => {
  let jwtService: CustomJwtService;
  let mockKeyService: Partial<SymmetricKeyService>;
  const secretKey = 'test-secret-key';

  beforeEach(() => {
    mockKeyService = {
      getKey: jest.fn().mockResolvedValue(secretKey),
    };

    jwtService = new CustomJwtService(mockKeyService as SymmetricKeyService);
  });

  describe('signPayload()', () => {
    it('should sign payload and return a valid JWT', async () => {
      const payload: UserPayloadWithKey = {
        userId: 'user123',
        email: 'test@mail.com',
        key: 'encryptedKey123',
        role: Role.GUEST,
      };

      const token = await jwtService.signPayload(payload, '6 h');

      expect(typeof token).toBe('string');

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
        key: 'secureKey456',
        role: Role.GUEST,
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: 600 });

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
        key: 'expiredKey',
        role: Role.GUEST,
      };

      const expiredToken = jwt.sign(payload, secretKey, { expiresIn: -10 }); // already expired

      await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow(
        jwt.TokenExpiredError,
      );
    });
  });
});
