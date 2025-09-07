import { Test, TestingModule } from '@nestjs/testing';
import { SymmetricKeyService } from './symmetric-key.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { createHmac } from 'node:crypto';

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

  it('should return default key if CLOUDFLARE_WORKER_URL or CLOUDFLARE_WORKER_HEADER_KEY is missing', async () => {
    delete process.env.CLOUDFLARE_WORKER_URL;
    const key = await service.getKey();
    expect(key).toBe('default_jwt_encryption_key');
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });

  it('should fetch and return the key from the worker URL with valid HMAC headers', async () => {
    const workerKey = 'secure_worker_key';
    const headerKey = process.env.CLOUDFLARE_WORKER_HEADER_KEY!;
    const expectedBody = JSON.stringify({});

    mockHttpService.get.mockReturnValueOnce(
      of({ data: { JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey } }),
    );

    const key = await service.getKey();
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

  it('should return default key if worker returns error', async () => {
    mockHttpService.get.mockReturnValueOnce(
      throwError(() => new Error('Unauthorized')),
    );
    const key = await service.getKey();
    expect(key).toBe('default_jwt_encryption_key');
  });

  it('should return cached key if TTL not expired', async () => {
    const cachedKey = 'cached_key';
    service['cachedKey'] = cachedKey;
    service['lastFetched'] = Date.now();

    const key = await service.getKey();
    expect(key).toBe(cachedKey);
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });
});
