/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { OpenMeteoClient } from './open-meteo.client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('WeatherService', () => {
  let service: WeatherService;
  let client: OpenMeteoClient;

  const mockOpenMeteoClient = {
    fetchForecast: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getForecast', () => {
    const lat = 52.52;
    const lon = 13.41;
    const cacheKey = `weather_forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;

    const mockRawData = {
      latitude: lat,
      longitude: lon,
      current_weather: {
        temperature: 20,
        windspeed: 10,
        winddirection: 180,
        weathercode: 0,
        time: '2023-01-01T00:00',
      },
      hourly: {
        relative_humidity_2m: [50],
        pressure_msl: [1013],
        apparent_temperature: [18],
        cloud_cover: [0],
      },
    };

    const expectedResult = {
      temperature: 20,
      humidity: 50,
      pressure: 1013,
      feels_like: 18,
      wind_speed_10m: 10,
      clouds: 0,
      uvi: 0,
      description: 'Clear sky',
      icon: 'clear-day',
      alerts: [],
    };

    it('should return cached forecast if available', async () => {
      mockCacheManager.get.mockResolvedValue(expectedResult);

      const result = await service.getForecast(lat, lon);

      expect(result).toEqual(expectedResult);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchForecast).not.toHaveBeenCalled();
    });

    it('should fetch forecast from client if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOpenMeteoClient.fetchForecast.mockResolvedValue(mockRawData);

      const result = await service.getForecast(lat, lon);

      expect(result).toEqual(expectedResult);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(client.fetchForecast).toHaveBeenCalledWith(lat, lon);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        expectedResult,
        1800000, // 30 minutes
      );
    });
  });
});
