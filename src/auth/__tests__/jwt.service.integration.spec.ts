import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '../jwt.service';
import { SymmetricKeyService } from '../symmetric-key/symmetric-key.service';
import { UserPayloadWithKey } from '../interfaces/auth.user.interface';
import { Role } from '../enums/roles.enum';
import { ConfigService } from '@nestjs/config';
import { mockGlobalFetch } from '../../../test/helper/fetch-mock';

describe('JwtService (integration)', () => {
  let jwtService: JwtService;
  let module: TestingModule;
  const workerUrl = 'http://test-worker.com';
  const headerKey = 'aabbccddeeff00112233445566778899';
  const clientId = 'test-client-id';
  const clientSecret = 'test-secret';

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'app.cloudflare.workerUrl') {
        return workerUrl;
      } else if (key === 'app.cloudflare.headerKey') {
        return headerKey;
      } else if (key === 'app.cloudflare.clientId') {
        return clientId;
      } else if (key === 'app.cloudflare.clientSecret') {
        return clientSecret;
      }

      return '';
    }),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        JwtService,
        SymmetricKeyService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should sign and verify a valid token', async () => {
    const payload: UserPayloadWithKey = {
      userId: 'user-123',
      email: 'user@example.com',
      key: 'secureKey123',
      role: Role.USER,
    };
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY:
          'mocked-test-symmetric-secret-key-long',
        JWT_SECRET: 'test-secret-key-long',
      },
    });

    const token = await jwtService.signPayload(payload, '6 h');
    expect(typeof token).toBe('string');

    const decoded = await jwtService.verifyToken(token);
    expect(decoded).toMatchObject({
      userId: payload.userId,
      email: payload.email,
      key: payload.key,
    });
    expect(decoded.exp).toBeDefined();
  });

  it('should throw error for expired token', async () => {
    const expiredPayload: UserPayloadWithKey & { expiresIn: number } = {
      userId: 'expired-user',
      email: 'expired@example.com',
      key: 'expiredKey',
      role: Role.USER,
      expiresIn: Math.floor(Date.now() / 1000) - 10,
    };
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY:
          'mocked-test-symmetric-secret-key-long',
        JWT_SECRET: 'test-secret-key-long',
      },
    });

    const expiredToken = await jwtService.signPayload(expiredPayload, '-10s');
    await new Promise((r) => setTimeout(r, 1500));
    await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow();
  });
});
