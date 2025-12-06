/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SolarWeatherService } from './solar-weather.service';
import { TemisClient } from './temis.client';
import { NoaaClient } from './noaa.client';
import { GfzClient } from './gfz.client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DateTime } from 'luxon';

describe('SolarWeatherService', () => {
  let service: SolarWeatherService;
  let temisClient: TemisClient;
  let noaaClient: NoaaClient;
  let gfzClient: GfzClient;

  const mockTemisClient = {
    getUVData: jest.fn(),
  };

  const mockNoaaClient = {
    getSolarRadiation: jest.fn(),
    getSolarRadiationByDate: jest.fn(),
  };

  const mockGfzClient = {
    getKpIndex: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolarWeatherService,
        { provide: TemisClient, useValue: mockTemisClient },
        { provide: NoaaClient, useValue: mockNoaaClient },
        { provide: GfzClient, useValue: mockGfzClient },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SolarWeatherService>(SolarWeatherService);
    temisClient = module.get<TemisClient>(TemisClient);
    noaaClient = module.get<NoaaClient>(NoaaClient);
    gfzClient = module.get<GfzClient>(GfzClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRadiation', () => {
    const lat = 52.52;
    const lon = 13.41;
    const cacheKey = `solar_radiation_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const today = new Date().toISOString().split('T')[0];

    const mockUvData = { cloud_Free_Erythemal_UV_index: 5, ozone: 300 };
    const mockSolarData = { kIndex: 1, aIndex: 3.6 };
    const mockKpData = {
      solarFlux: 3,
      sunsPotNumber: 25,
      Kp1: 1,
      Kp2: 1,
      Kp3: 1,
      Kp4: 1,
      Kp5: 1,
      Kp6: 1,
      Kp7: 1,
      Kp8: 1,
      ap1: 1,
      ap2: 1,
      ap3: 1,
      ap4: 1,
      ap5: 1,
      ap6: 1,
      ap7: 1,
      ap8: 1,
    };

    const expectedResult = [
      {
        date: today,
        UVIndex: 5,
        ozone: 300,
        kpIndex: 1,
        aRunning: 3.6,
        Kp1: 1,
        Kp2: 1,
        Kp3: 1,
        Kp4: 1,
        Kp5: 1,
        Kp6: 1,
        Kp7: 1,
        Kp8: 1,
        ap1: 1,
        ap2: 1,
        ap3: 1,
        ap4: 1,
        ap5: 1,
        ap6: 1,
        ap7: 1,
        ap8: 1,
        solarFlux: 3,
        sunsPotNumber: 25,
      },
    ];

    it('should return cached data if available', async () => {
      mockCacheManager.get.mockResolvedValue(expectedResult);

      const result = await service.getRadiation(lat, lon);

      expect(result).toEqual(expectedResult);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(temisClient.getUVData).not.toHaveBeenCalled();
    });

    it('should fetch data from clients if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      mockTemisClient.getUVData.mockResolvedValue(mockUvData);
      mockNoaaClient.getSolarRadiation.mockResolvedValue(mockSolarData);
      mockGfzClient.getKpIndex.mockResolvedValue(mockKpData);

      const result = await service.getRadiation(lat, lon);

      expect(result).toEqual(expectedResult);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(temisClient.getUVData).toHaveBeenCalledWith(lat, lon);
      expect(noaaClient.getSolarRadiation).toHaveBeenCalled();
      expect(gfzClient.getKpIndex).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        expectedResult,
        3600000,
      );
    });
  });

  describe('getGeophysicalWeatherData', () => {
    const mockSolarData = {
      kIndex: 2.67,
      aIndex: 12,
      solarFlux: 0,
      pastWeather: { level: '' },
      nextWeather: { level: '' },
    };
    it('should fetch data from clients', async () => {
      const dt = DateTime.now().minus({ days: 6 });
      mockNoaaClient.getSolarRadiationByDate.mockResolvedValue(mockSolarData);

      const result = await service.getGeophysicalWeatherData(dt.toISO());

      expect(result).toEqual(mockSolarData);
      expect(mockNoaaClient.getSolarRadiationByDate).toHaveBeenCalled();
    });
  });
});
