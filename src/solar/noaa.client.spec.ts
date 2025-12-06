import { Test, TestingModule } from '@nestjs/testing';
import { NoaaClient } from './noaa.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { DateTime } from 'luxon';
import { IGeophysicalWeatherData } from './interfaces/radiation.interface';

describe('NoaaClient', () => {
  let service: NoaaClient;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  // Helper to generate dynamic mock data based on the provided structure
  const generateMockData = (
    baseDate: DateTime,
    beforeDays: number = -1,
  ): string[][] => {
    const header = ['time_tag', 'Kp', 'a_running', 'station_count'];
    const data = [];

    // Generate data for 3 days: yesterday, today, tomorrow
    for (let i = beforeDays; i <= 1; i++) {
      const date = baseDate.plus({ days: i });
      const dateStr = date.toFormat('yyyy-MM-dd');

      // 8 entries per day (every 3 hours)
      for (let j = 0; j < 24; j += 3) {
        const timeStr = `${dateStr} ${j.toString().padStart(2, '0')}:00:00.000`;
        // Mock values similar to the example
        const kp = (1 + Math.random() * 4).toFixed(2);
        const aRunning = Math.floor(Math.random() * 20).toString();
        const stationCount = '8';
        data.push([timeStr, kp, aRunning, stationCount]);
      }
    }

    return [header, ...data];
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoaaClient,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<NoaaClient>(NoaaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSolarRadiation', () => {
    it('should return cached data if available', async () => {
      const cachedData = [
        { Kp: 2.67, aRunning: 12, date: '2025-11-22 00:00:00.000' },
      ];
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSolarRadiation();

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('solar_radiation_noaa');
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and process data if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');

      const today = DateTime.now();
      const mockData = generateMockData(today);

      const response: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {} as unknown as AxiosHeaders,
        config: { headers: {} as unknown as AxiosHeaders },
      };
      mockHttpService.get.mockReturnValue(of(response));

      const result = await service.getSolarRadiation();

      expect(result).toBeDefined();

      expect(result).toHaveProperty('kIndex');
      expect(result).toHaveProperty('aIndex');
      expect(result).toHaveProperty('solarFlux');
      expect(result).toHaveProperty('pastWeather');
      expect(result).toHaveProperty('nextWeather');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'solar_radiation_noaa',
        result,
        3600000,
      );
    });

    it('should return undefined on API error', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error')),
      );

      const result = await service.getSolarRadiation();

      expect(result).toBeUndefined();
    });

    it('should return undefined if response data is invalid', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');

      const response: AxiosResponse = {
        data: 'invalid-string-data', // Not an array
        status: 200,
        statusText: 'OK',
        headers: {} as unknown as AxiosHeaders,
        config: { headers: {} as unknown as AxiosHeaders },
      };
      mockHttpService.get.mockReturnValue(of(response));

      const result = await service.getSolarRadiation();

      expect(result).toBeUndefined();
    });
  });

  describe('getSolarRadiationByDate', () => {
    it('should return cached data if available', async () => {
      const isoDate = DateTime.now().minus({ days: 6 }).toISO();
      const cachedData = {
        kIndex: 2.67,
        aIndex: 12,
        solarFlux: 0,
        pastWeather: { level: '' },
        nextWeather: { level: '' },
      };
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSolarRadiationByDate(isoDate);

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `solar_geophysical_weather_data_${isoDate}`,
      );
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and process data if not cached and 6 days ', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');

      const dt = DateTime.now().minus({ days: 6 });
      const mockData = generateMockData(DateTime.now(), -10);

      const data = mockData.filter((item) =>
        item[0].includes(dt.toFormat('yyyy-MM-dd')),
      );

      const expected: IGeophysicalWeatherData = {
        solarFlux: 0,
        aIndex: parseInt(data[data.length - 1][2], 10),
        kIndex: parseFloat(data[data.length - 1][1]),
        pastWeather: { level: '' },
        nextWeather: { level: '' },
      };

      const response: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {} as unknown as AxiosHeaders,
        config: { headers: {} as unknown as AxiosHeaders },
      };
      mockHttpService.get.mockReturnValue(of(response));

      const result = await service.getSolarRadiationByDate(dt.toISO());

      expect(result).toBeDefined();

      expect(result).toHaveProperty('solarFlux');
      expect(result).toHaveProperty('aIndex');
      expect(result).toHaveProperty('kIndex');
      expect(result).toHaveProperty('pastWeather');
      expect(result).toHaveProperty('nextWeather');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `solar_geophysical_weather_data_${dt.toISO()}`,
        expected,
        3600000,
      );
    });

    it('should fetch and process data if not cached and >= 7 days ', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');

      const dt = DateTime.now().minus({ days: 7 });
      const mockData = generateMockData(DateTime.now(), -10);

      const response: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {} as unknown as AxiosHeaders,
        config: { headers: {} as unknown as AxiosHeaders },
      };
      mockHttpService.get.mockReturnValue(of(response));

      const result = await service.getSolarRadiationByDate(dt.toISO());

      expect(result).toBeDefined();

      expect(result).toHaveProperty('solarFlux');
      expect(result).toHaveProperty('aIndex');
      expect(result).toHaveProperty('kIndex');
      expect(result).toHaveProperty('pastWeather');
      expect(result).toHaveProperty('nextWeather');

      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should return empty data if invalid date', async () => {
      const isoDate = '';
      const expected: IGeophysicalWeatherData = {
        solarFlux: 0,
        aIndex: 0,
        kIndex: 0,
        pastWeather: { level: '' },
        nextWeather: { level: '' },
      };
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getSolarRadiationByDate(isoDate);

      expect(result).toEqual(expected);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });
  });

  describe('processPlanetaryKIndex', () => {
    it('should return undefined for invalid input', () => {
      const dt = DateTime.now();
      expect(service.processPlanetaryKIndex(undefined, dt)).toBeUndefined();
      expect(
        service.processPlanetaryKIndex([] as string[], dt),
      ).toBeUndefined();
    });

    it('should process valid data correctly', () => {
      const dt = DateTime.now();
      const todayStr = dt.toFormat('yyyy-MM-dd');
      const mockData: any[] = [
        ['header'],
        [`${todayStr} 00:00:00.000`, '3.00', '15', '8'],
        ['2000-01-01 00:00:00.000', '1.00', '5', '8'], // Different date
      ];

      const result = service.processPlanetaryKIndex(mockData as string[], dt);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        Kp: 3.0,
        aRunning: 15,
        date: `${todayStr} 00:00:00.000`,
      });
    });

    it('should handle parsing errors gracefully', () => {
      const dt = DateTime.now();

      // Malformed data that might cause parsing error if code assumes structure
      // The code does `parseFloat(item[1])` and `parseInt(item[2])`.
      // If item is not an array or too short, it might throw or return NaN.
      // The current implementation has a try-catch block.

      // Let's force an error. The code iterates `for (const item of items)`.
      // If `items` contains something that is not iterable or doesn't have index access as expected if it wasn't an array of arrays (though typescript says string[]).
      // The implementation casts `data as string[]` but treats elements as arrays `item[0]`.

      const mockData: unknown[] = [
        null, // This will cause error when accessing item[0]
      ];

      const result = service.processPlanetaryKIndex(mockData as string[], dt);
      expect(result).toBeUndefined();
    });
  });
});
