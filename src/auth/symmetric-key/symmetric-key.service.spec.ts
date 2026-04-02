import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SymmetricKeyService } from './symmetric-key.service';
import { ConfigService } from '@nestjs/config';
import { mockGlobalFetch } from '../../../test/helper/fetch-mock';

describe('SymmetricKeyService with HMAC', () => {
  let service: SymmetricKeyService;
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
        SymmetricKeyService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SymmetricKeyService>(SymmetricKeyService);

    jest.clearAllMocks();
    service['cachedKey'] = null;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (module) {
      await module.close();
    }
  });

  it("should fetch and return the 'JWT_SYMMETRIC_KEY_ENCRYPTION_KEY' key from the worker URL with valid HMAC headers", async () => {
    const workerKey = 'secure_worker_key';
    const jwtSecret = 'secure_jwt_secret';

    const expectedData = {
      JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
      JWT_SECRET: jwtSecret,
    };
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: expectedData,
    });

    const key = await service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY');
    expect(key).toBe(workerKey);
    expect(global.fetch).toHaveBeenCalledWith(workerUrl, {
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': clientId,
        'CF-Access-Client-Secret': clientSecret,
        'Strict-Transport-Security':
          'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        'X-Signature': expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        'X-Timestamp': expect.any(String),
      },
    });
  });

  it("should fetch and return the 'JWT_SYMMETRIC_KEY_ENCRYPTION_KEY' key from the worker URL with valid HMAC headers", async () => {
    const workerKey = 'secure_worker_key';
    const jwtSecret = 'secure_jwt_secret';

    const expectedData = {
      JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
      JWT_SECRET: jwtSecret,
    };
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: expectedData,
    });

    const key = await service.getKey('JWT_SECRET');
    expect(key).toBe(jwtSecret);
    expect(global.fetch).toHaveBeenCalledWith(workerUrl, {
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': clientId,
        'CF-Access-Client-Secret': clientSecret,
        'Strict-Transport-Security':
          'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        'X-Signature': expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        'X-Timestamp': expect.any(String),
      },
    });
  });

  it('should throw error if body return unknown body value', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: { OTHER_DATA: 'test' },
    });

    await expect(
      service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY'),
    ).rejects.toThrow(InternalServerErrorException);
    expect(global.fetch).toHaveBeenCalledWith(workerUrl, {
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': clientId,
        'CF-Access-Client-Secret': clientSecret,
        'Strict-Transport-Security':
          'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        'X-Signature': expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        'X-Timestamp': expect.any(String),
      },
    });
  });

  it('should throw error if worker returns error', async () => {
    mockGlobalFetch({
      ok: false,
      status: 500,
      errorMessage: 'Unauthorized',
    });
    await expect(
      service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY'),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it("should return cached 'JWT_SYMMETRIC_KEY_ENCRYPTION_KEY' key if TTL not expired", async () => {
    const cachedKey = {
      JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: 'cached_key',
      JWT_SECRET: 'string',
    };
    service['cachedKey'] = cachedKey;
    service['lastFetched'] = Date.now();

    const key = await service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY');
    expect(key).toBe(cachedKey.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return cached 'JWT_SECRET' key if TTL not expired", async () => {
    const cachedKey = {
      JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: 'cached_key',
      JWT_SECRET: 'string',
    };
    service['cachedKey'] = cachedKey;
    service['lastFetched'] = Date.now();

    const key = await service.getKey('JWT_SECRET');
    expect(key).toBe(cachedKey.JWT_SECRET);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw error if CLOUDFLARE_WORKER_URL or CLOUDFLARE_WORKER_HEADER_KEY is missing', async () => {
    mockConfigService.get.mockImplementationOnce((key: string) => {
      if (key === 'app.cloudflare.workerUrl') {
        return '';
      } else if (key === 'app.cloudflare.headerKey') {
        return headerKey;
      } else if (key === 'app.cloudflare.clientId') {
        return clientId;
      } else if (key === 'app.cloudflare.clientSecret') {
        return clientSecret;
      }

      return '';
    });

    expect(global.fetch).not.toHaveBeenCalled();
    await expect(
      service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
