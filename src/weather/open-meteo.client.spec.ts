import { Test, TestingModule } from '@nestjs/testing';
import { OpenMeteoClient } from './open-meteo.client';
import { ConfigService } from '@nestjs/config';
import { fetchWeatherApi } from 'openmeteo';

jest.mock('openmeteo', () => ({
  fetchWeatherApi: jest.fn(),
}));

describe('OpenMeteoClient', () => {
  let client: OpenMeteoClient;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenMeteoClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<OpenMeteoClient>(OpenMeteoClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('fetchForecast', () => {
    it('should fetch forecast data and map correctly', async () => {
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');
      const lat = 52.52;
      const lon = 13.41;

      // Mocking the complex response structure from openmeteo
      const mockCurrentVariables: Record<number, { value: () => number }> = {
        0: { value: () => 20 }, // temperature
        1: { value: () => 50 }, // humidity
        2: { value: () => 18 }, // feels_like
        7: { value: () => 0 }, // clouds
        8: { value: () => 1013 }, // pressure
        9: { value: () => 10 }, // wind_speed_10m
      };

      const mockDailyVariables: Record<
        number,
        { valuesArray: () => Float32Array }
      > = {
        0: { valuesArray: () => new Float32Array([5]) }, // uv_index_max
      };

      const mockResponse = {
        current: () => ({
          variables: (index: number) => mockCurrentVariables[index],
        }),
        daily: () => ({
          time: () => 0,
          timeEnd: () => 86400, // 1 day
          interval: () => 86400,
          variables: (index: number) => mockDailyVariables[index],
        }),
        utcOffsetSeconds: () => 0,
      };

      (fetchWeatherApi as jest.Mock).mockResolvedValue([mockResponse]);

      const result = await client.fetchForecast(lat, lon);

      expect(result).toEqual({
        temperature: 20,
        humidity: 50,
        pressure: 1013,
        feels_like: 18,
        wind_speed_10m: 10,
        clouds: 0,
        uvi: 5,
        description: '',
        icon: '',
        alerts: [],
      });

      expect(fetchWeatherApi).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/forecast',
        {
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation',
            'rain',
            'showers',
            'weather_code',
            'cloud_cover',
            'surface_pressure',
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
          ],
          daily: ['uv_index_max', 'precipitation_sum', 'rain_sum'],
          latitude: lat,
          longitude: lon,
          wind_speed_unit: 'ms',
        },
      );
    });

    it('should throw error if config is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      await expect(client.fetchForecast(0, 0)).rejects.toThrow(
        'OpenMeteo API URL is not configured',
      );
    });
  });

  describe('fetchHistorical', () => {
    it('should fetch historical data and map correctly', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const date = new Date('2023-01-01T00:00:00Z');
      mockConfigService.get.mockReturnValue(
        'https://archive-api.open-meteo.com/v1/archive',
      );

      // Reuse mock structure but maybe with different variables if necessary
      const mockVariables: Record<number, { valuesArray: () => Float32Array }> =
        {
          0: { valuesArray: () => new Float32Array([15]) }, // temperature
          1: { valuesArray: () => new Float32Array([5]) }, // wind_speed
          3: { valuesArray: () => new Float32Array([60]) }, // humidity
          4: { valuesArray: () => new Float32Array([50]) }, // cloud_cover
          5: { valuesArray: () => new Float32Array([1000]) }, // pressure
        };

      const mockResponse = {
        hourly: () => ({
          time: () => 0,
          timeEnd: () => 86400,
          interval: () => 86400,
          variables: (index: number) => mockVariables[index],
        }),
        utcOffsetSeconds: () => 0,
      };

      (fetchWeatherApi as jest.Mock).mockResolvedValue([mockResponse]);

      const result = await client.fetchHistorical(lat, lon, date);

      expect(result).toBeDefined();
      expect(result?.temperature).toBe(15);
      expect(result?.humidity).toBe(60);

      expect(fetchWeatherApi).toHaveBeenCalledWith(
        'https://archive-api.open-meteo.com/v1/archive/v1/forecast',
        expect.objectContaining({
          daily: [],
          end_date: '2023-01-01',
          hourly: [
            'temperature_2m',
            'wind_speed_10m',
            'precipitation',
            'relative_humidity_2m',
            'cloud_cover',
            'pressure_msl',
          ],
          latitude: 52.52,
          longitude: 13.41,
          start_date: '2023-01-01',
          timezone: 'auto',
          wind_speed_unit: 'ms',
        }),
      );
    });
  });
});
