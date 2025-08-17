// src/auth/symmetric-key.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SymmetricKeyService } from './symmetric-key.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

describe('SymmetricKeyService', () => {
  let service: SymmetricKeyService;
  let httpService: HttpService;

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
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
    process.env.CLOUDFLARE_WORKER_URL = 'http://test-worker.com';
    service['cachedKey'] = null;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKey', () => {
    it('should return default key if CLOUDFLARE_WORKER_URL is not defined', async () => {
      delete process.env.CLOUDFLARE_WORKER_URL;
      const getSpy = jest.spyOn(httpService, 'get');

      const key = await service.getKey();

      expect(key).toBe('default_jwt_encryption_key');
      expect(getSpy).toHaveBeenCalledTimes(0);
    });

    it('should fetch and return the key from the worker URL', async () => {
      const workerKey = 'worker_jwt_key';
      mockHttpService.get.mockReturnValueOnce(
        of({ data: { JWT_KEY: workerKey } }),
      );
      const getSpy = jest.spyOn(httpService, 'get');

      const key = await service.getKey();

      expect(key).toBe(workerKey);
      expect(getSpy).toHaveBeenCalledWith('http://test-worker.com');
    });

    it('should return default key if fetching from worker fails', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => new Error('Network error')),
      );
      const getSpy = jest.spyOn(httpService, 'get');

      const key = await service.getKey();

      expect(key).toBe('default_jwt_encryption_key');
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('should return cached key if TTL has not expired', async () => {
      const cachedKey = 'cached_key';
      service['cachedKey'] = cachedKey;
      service['lastFetched'] = Date.now();
      const getSpy = jest.spyOn(httpService, 'get');

      const key = await service.getKey();

      expect(key).toBe(cachedKey);
      expect(getSpy).toHaveBeenCalledTimes(0);
    });
  });
});
