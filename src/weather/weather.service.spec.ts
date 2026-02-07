/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { OpenMeteoClient } from './open-meteo.client';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { UserService } from '../users/users.service';
import { IForecastResponse } from './interfaces/weather.interface';

describe('WeatherService', () => {
  let service: WeatherService;
  let client: OpenMeteoClient;
  let module: TestingModule;
  let cacheManager: Cache;

  const mockOpenMeteoClient = {
    getCurrentForecast: jest.fn(),
    fetchHistorical: jest.fn(),
    fetchHourlyForecast: jest.fn(),
    getForecast: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockUserService = {
    trackWeatherRequest: jest.fn(),
  };

  const mockForecast: IForecastResponse = {
    latitude: 52.52,
    longitude: 13.41,
    timezone: 'UTC',
    hourly: [],
    daily: [],
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
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    client = module.get<OpenMeteoClient>(OpenMeteoClient);
    cacheManager = module.get(CACHE_MANAGER);
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

  describe('getCurrentWeather', () => {
    const lat = 52.52;
    const lon = 13.41;
    const cacheKey = `weather_current_${lat.toFixed(2)}_${lon.toFixed(2)}`;

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

      const result = await service.getCurrentWeather(lat, lon, 'user123');

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.getCurrentForecast).not.toHaveBeenCalled();
      expect(mockUserService.trackWeatherRequest).not.toHaveBeenCalled();
    });

    it('should fetch forecast from client if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.getCurrentForecast.mockResolvedValue(mockWeatherData);

      const result = await service.getCurrentWeather(lat, lon, 'user123');

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.getCurrentForecast).toHaveBeenCalledWith(lat, lon);
      expect(mockUserService.trackWeatherRequest).toHaveBeenCalledWith(
        'user123',
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        mockWeatherData,
        1800000, // 30 minutes
      );
    });
    it('should throw error if client fetch fails', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.getCurrentForecast.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(
        service.getCurrentWeather(lat, lon, 'user123'),
      ).rejects.toThrow('Fetch failed');
      expect(client.getCurrentForecast).toHaveBeenCalledWith(lat, lon);
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

      const result = await service.getHistorical(lat, lon, date, 'user123');

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchHistorical).not.toHaveBeenCalled();
      expect(mockUserService.trackWeatherRequest).not.toHaveBeenCalled();
    });

    it('should fetch historical data from client if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.fetchHistorical.mockResolvedValue(mockWeatherData);

      const result = await service.getHistorical(lat, lon, date, 'user123');

      expect(result).toEqual(mockWeatherData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchHistorical).toHaveBeenCalledWith(lat, lon, date);
      expect(mockUserService.trackWeatherRequest).toHaveBeenCalledWith(
        'user123',
      );
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

      await expect(
        service.getHistorical(lat, lon, date, 'user123'),
      ).rejects.toThrow('Fetch failed');
      expect(client.fetchHistorical).toHaveBeenCalledWith(lat, lon, date);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('getHourlyForecast', () => {
    const lat = 52.52;
    const lon = 13.41;
    const start = new Date('2023-01-01');
    const end = new Date('2023-01-02');

    const mockHourlyForecast = [
      {
        datetime: '2023-01-01T00:00:00.000Z',
        temperature: 10,
        humidity: 60,
        pressure: 1000,
        windSpeed: 5,
        clouds: 20,
        directRadiation: 100,
        uvi: 2,
        description: '',
      },
    ];

    it('should return hourly forecast from client', async () => {
      mockOpenMeteoClient.fetchHourlyForecast.mockResolvedValue(
        mockHourlyForecast,
      );

      const result = await service.getHourlyForecast(
        lat,
        lon,
        start,
        end,
        'user123',
      );

      expect(result).toEqual(mockHourlyForecast);
      expect(client.fetchHourlyForecast).toHaveBeenCalledWith(
        lat,
        lon,
        start,
        end,
      );
      expect(mockUserService.trackWeatherRequest).toHaveBeenCalledWith(
        'user123',
      );
    });

    it('should not track request if userId is missing', async () => {
      mockOpenMeteoClient.fetchHourlyForecast.mockResolvedValue(
        mockHourlyForecast,
      );

      const result = await service.getHourlyForecast(lat, lon, start, end);

      expect(result).toEqual(mockHourlyForecast);
      expect(mockUserService.trackWeatherRequest).not.toHaveBeenCalled();
    });
  });

  describe('getForecast', () => {
    it('should return cached forecast if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockForecast);

      const result = await service.getForecast(52.52, 13.41, 'user123');

      expect(result).toEqual(mockForecast);
      expect(client.getForecast).not.toHaveBeenCalled();
      expect(mockUserService.trackWeatherRequest).not.toHaveBeenCalled();
    });

    it('should fetch and cache forecast if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.getForecast.mockResolvedValue(mockForecast);

      const result = await service.getForecast(52.52, 13.41, 'user123');

      expect(result).toEqual(mockForecast);
      expect(client.getForecast).toHaveBeenCalledWith(52.52, 13.41);
      expect(mockUserService.trackWeatherRequest).toHaveBeenCalledWith(
        'user123',
      );
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should not track request if userId is missing', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.getForecast.mockResolvedValue(mockForecast);

      await service.getForecast(52.52, 13.41);

      expect(mockUserService.trackWeatherRequest).not.toHaveBeenCalled();
    });
  });
});
