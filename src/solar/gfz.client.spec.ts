/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GfzClient } from './gfz.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('GfzClient', () => {
  let client: GfzClient;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.gfz-potsdam.de'),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GfzClient,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    client = module.get<GfzClient>(GfzClient);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('getKpIndex', () => {
    it('should fetch Kp index data', async () => {
      const mockData = { kp_index: 3 };
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as unknown as AxiosHeaders },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await client.getKpIndex();

      expect(result).toEqual(mockData);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.gfz-potsdam.de/kp-index/qp_nowcast.json',
      );
    });

    it('should return null on error', async () => {
      mockHttpService.get.mockImplementation(() => {
        throw new Error('API Error');
      });

      const result = await client.getKpIndex();

      expect(result).toBeNull();
    });
  });
});
