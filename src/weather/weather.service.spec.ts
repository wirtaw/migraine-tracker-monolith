/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { OpenMeteoClient } from './open-meteo.client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('WeatherService', () => {
  let service: WeatherService;
  let client: OpenMeteoClient;
  let module: TestingModule;

  const mockOpenMeteoClient = {
    fetchForecast: jest.fn(),
    fetchHistorical: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: OpenMeteoClient,
          useValue: mockOpenMeteoClient,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    client = module.get<OpenMeteoClient>(OpenMeteoClient);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getForecast', () => {
    const lat = 52.52;
    const lon = 13.41;
    const cacheKey = `weather_forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;

    const mockWeatherData = {
      temperature: 20,
      humidity: 50,
      pressure: 1013,
      feels_like: 18,
      wind_speed_10m: 10,
      clouds: 0,
      uvi: 0,
      description: '',
      icon: '',
      alerts: [],
    };

    it('should return cached forecast if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockWeatherData);

      const result = await service.getForecast(lat, lon);

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchForecast).not.toHaveBeenCalled();
    });

    it('should fetch forecast from client if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.fetchForecast.mockResolvedValue(mockWeatherData);

      const result = await service.getForecast(lat, lon);

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchForecast).toHaveBeenCalledWith(lat, lon);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        mockWeatherData,
        1800000, // 30 minutes
      );
    });
    it('should throw error if client fetch fails', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.fetchForecast.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(service.getForecast(lat, lon)).rejects.toThrow(
        'Fetch failed',
      );
      expect(client.fetchForecast).toHaveBeenCalledWith(lat, lon);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('getHistorical', () => {
    const lat = 52.52;
    const lon = 13.41;
    const date = new Date('2023-01-01');
    const dateStr = '2023-01-01';
    const cacheKey = `weather_historical_${lat.toFixed(2)}_${lon.toFixed(2)}_${dateStr}`;

    const mockWeatherData = {
      temperature: 15,
      humidity: 60,
      pressure: 1000,
      feels_like: undefined,
      wind_speed_10m: 5,
      clouds: 50,
      uvi: undefined,
      description: '',
      icon: '',
      alerts: [],
    };

    it('should return cached historical data if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockWeatherData);

      const result = await service.getHistorical(lat, lon, date);

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchHistorical).not.toHaveBeenCalled();
    });

    it('should fetch historical data from client if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.fetchHistorical.mockResolvedValue(mockWeatherData);

      const result = await service.getHistorical(lat, lon, date);

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchHistorical).toHaveBeenCalledWith(lat, lon, date);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        mockWeatherData,
        2592000000, // 30 days
      );
    });

    it('should throw error if client fetch fails', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.fetchHistorical.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(service.getHistorical(lat, lon, date)).rejects.toThrow(
        'Fetch failed',
      );
      expect(client.fetchHistorical).toHaveBeenCalledWith(lat, lon, date);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });
});
