import { Test, TestingModule } from '@nestjs/testing';

import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { createHmac } from 'node:crypto';
import { InternalServerErrorException } from '@nestjs/common';
import { SymmetricKeyService } from './symmetric-key.service';

describe('SymmetricKeyService with HMAC', () => {
  let service: SymmetricKeyService;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SymmetricKeyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<SymmetricKeyService>(SymmetricKeyService);

    jest.clearAllMocks();
    process.env.CLOUDFLARE_WORKER_URL = 'http://test-worker.com';
    process.env.CLOUDFLARE_WORKER_HEADER_KEY =
      'aabbccddeeff00112233445566778899';
    service['cachedKey'] = null;
  });

  it('should throw error if CLOUDFLARE_WORKER_URL or CLOUDFLARE_WORKER_HEADER_KEY is missing', async () => {
    delete process.env.CLOUDFLARE_WORKER_URL;
    expect(mockHttpService.get).not.toHaveBeenCalled();
    await expect(
      service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY'),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it("should fetch and return the 'JWT_SYMMETRIC_KEY_ENCRYPTION_KEY' key from the worker URL with valid HMAC headers", async () => {
    const workerKey = 'secure_worker_key';
    const jwtSecret = 'secure_jwt_secret';
    const headerKey = process.env.CLOUDFLARE_WORKER_HEADER_KEY!;
    const expectedBody = JSON.stringify({});

    mockHttpService.get.mockReturnValueOnce(
      of({
        data: {
          JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
          JWT_SECRET: jwtSecret,
        },
      }),
    );

    const key = await service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY');
    expect(key).toBe(workerKey);
    expect(mockHttpService.get).toHaveBeenCalled();

    const call = mockHttpService.get.mock.calls[0] as Parameters<
      HttpService['get']
    >;
    const [url, config] = call;

    expect(url).toBe(process.env.CLOUDFLARE_WORKER_URL);
    if (!config?.headers) {
      throw new Error('Missing headers in Axios config');
    }
    expect(config?.headers['X-Timestamp']).toBeDefined();
    expect(config?.headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/);

    if (!config?.headers['X-Timestamp']) {
      throw new Error("Missing headers['X-Timestamp'] in Axios config");
    }
    const timestamp = config?.headers['X-Timestamp'] as string;
    const message = `${timestamp}:${expectedBody}`;
    const hmac = createHmac('sha256', Buffer.from(headerKey, 'hex'));
    hmac.update(message);
    const expectedSignature = hmac.digest('hex');

    expect(config?.headers['X-Signature']).toBe(expectedSignature);
  });

  it("should fetch and return the 'JWT_SECRET' key from the worker URL with valid HMAC headers", async () => {
    const workerKey = 'secure_worker_key';
    const jwtSecret = 'secure_jwt_secret';
    const headerKey = process.env.CLOUDFLARE_WORKER_HEADER_KEY!;
    const expectedBody = JSON.stringify({});

    mockHttpService.get.mockReturnValueOnce(
      of({
        data: {
          JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
          JWT_SECRET: jwtSecret,
        },
      }),
    );

    const key = await service.getKey('JWT_SECRET');
    expect(key).toBe(jwtSecret);
    expect(mockHttpService.get).toHaveBeenCalled();

    const call = mockHttpService.get.mock.calls[0] as Parameters<
      HttpService['get']
    >;
    const [url, config] = call;

    expect(url).toBe(process.env.CLOUDFLARE_WORKER_URL);
    if (!config?.headers) {
      throw new Error('Missing headers in Axios config');
    }
    expect(config?.headers['X-Timestamp']).toBeDefined();
    expect(config?.headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/);

    if (!config?.headers['X-Timestamp']) {
      throw new Error("Missing headers['X-Timestamp'] in Axios config");
    }
    const timestamp = config?.headers['X-Timestamp'] as string;
    const message = `${timestamp}:${expectedBody}`;
    const hmac = createHmac('sha256', Buffer.from(headerKey, 'hex'));
    hmac.update(message);
    const expectedSignature = hmac.digest('hex');

    expect(config?.headers['X-Signature']).toBe(expectedSignature);
  });

  it('should throw error if body return unknown body value', async () => {
    const headerKey = process.env.CLOUDFLARE_WORKER_HEADER_KEY!;
    const expectedBody = JSON.stringify({});

    mockHttpService.get.mockReturnValueOnce(
      of({ data: { OTHER_DATA: 'test' } }),
    );

    await expect(
      service.getKey('JWT_SYMMETRIC_KEY_ENCRYPTION_KEY'),
    ).rejects.toThrow(InternalServerErrorException);
    expect(mockHttpService.get).toHaveBeenCalled();

    const call = mockHttpService.get.mock.calls[0] as Parameters<
      HttpService['get']
    >;
    const [url, config] = call;

    expect(url).toBe(process.env.CLOUDFLARE_WORKER_URL);
    if (!config?.headers) {
      throw new Error('Missing headers in Axios config');
    }
    expect(config?.headers['X-Timestamp']).toBeDefined();
    expect(config?.headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/);

    if (!config?.headers['X-Timestamp']) {
      throw new Error("Missing headers['X-Timestamp'] in Axios config");
    }
    const timestamp = config?.headers['X-Timestamp'] as string;
    const message = `${timestamp}:${expectedBody}`;
    const hmac = createHmac('sha256', Buffer.from(headerKey, 'hex'));
    hmac.update(message);
    const expectedSignature = hmac.digest('hex');

    expect(config?.headers['X-Signature']).toBe(expectedSignature);
  });

  it('should throw error if worker returns error', async () => {
    mockHttpService.get.mockReturnValueOnce(
      throwError(() => new InternalServerErrorException('Unauthorized')),
    );
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
    expect(mockHttpService.get).not.toHaveBeenCalled();
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
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });
});
