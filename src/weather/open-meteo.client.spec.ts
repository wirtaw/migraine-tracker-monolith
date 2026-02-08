import { Test, TestingModule } from '@nestjs/testing';
import { OpenMeteoClient } from './open-meteo.client';
import { ConfigService } from '@nestjs/config';
import { fetchWeatherApi } from 'openmeteo';

jest.mock('openmeteo', () => ({
  fetchWeatherApi: jest.fn(),
}));

describe('OpenMeteoClient', () => {
  let client: OpenMeteoClient;
  let module: TestingModule;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
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

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('fetchForecast', () => {
    it('should fetch forecast data and map correctly', async () => {
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');
      const lat = 52.52;
      const lon = 13.41;

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

      const result = await client.getCurrentForecast(lat, lon);

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
      await expect(client.getCurrentForecast(0, 0)).rejects.toThrow(
        'OpenMeteo API URL is not configured',
      );
    });

    it('should throw error if request return undefined', async () => {
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');
      const lat = 52.52;
      const lon = 13.41;

      (fetchWeatherApi as jest.Mock).mockResolvedValue(null);

      await expect(client.getCurrentForecast(lat, lon)).rejects.toThrow(
        'Weather data fetch failed',
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

    it('should throw error if config is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const lat = 52.52;
      const lon = 13.41;
      const date = new Date('2023-01-01T00:00:00Z');
      await expect(client.fetchHistorical(lat, lon, date)).rejects.toThrow(
        'OpenMeteo Archive API URL is not configured',
      );
    });

    it('should throw error if request return undefined', async () => {
      mockConfigService.get.mockReturnValue(
        'https://archive-api.open-meteo.com/v1/archive',
      );
      const lat = 52.52;
      const lon = 13.41;
      const date = new Date('2023-01-01T00:00:00Z');

      (fetchWeatherApi as jest.Mock).mockResolvedValue(null);

      await expect(client.fetchHistorical(lat, lon, date)).rejects.toThrow(
        'Weather historical data fetch failed',
      );
    });
  });

  describe('fetchHourlyForecast', () => {
    it('should fetch hourly forecast and map correctly', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const start = new Date('2023-01-01T00:00:00Z');
      const end = new Date('2023-01-02T00:00:00Z');
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');

      const mockVariables: Record<number, { valuesArray: () => Float32Array }> =
        {
          0: { valuesArray: () => new Float32Array([10]) }, // temperature
          1: { valuesArray: () => new Float32Array([60]) }, // humidity
          2: { valuesArray: () => new Float32Array([1000]) }, // pressure
          3: { valuesArray: () => new Float32Array([5]) }, // wind_speed
          4: { valuesArray: () => new Float32Array([20]) }, // cloud_cover
          5: { valuesArray: () => new Float32Array([100]) }, // direct_radiation
          6: { valuesArray: () => new Float32Array([2]) }, // uv_index
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

      const result = await client.fetchHourlyForecast(lat, lon, start, end);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        datetime: '1970-01-01T00:00:00.000Z', // Based on time 0
        temperature: 10,
        humidity: 60,
        pressure: 1000,
        windSpeed: 5,
        clouds: 20,
        directRadiation: 100,
        uvi: 2,
        description: '',
      });

      expect(fetchWeatherApi).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/forecast',
        expect.objectContaining({
          latitude: lat,
          longitude: lon,
          start_date: '2023-01-01',
          end_date: '2023-01-02',
          hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'surface_pressure',
            'wind_speed_10m',
            'cloud_cover',
            'direct_radiation',
            'uv_index',
          ],
        }),
      );
    });

    it('should throw error if config is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const lat = 52.52;
      const lon = 13.41;
      const start = new Date();
      const end = new Date();
      await expect(
        client.fetchHourlyForecast(lat, lon, start, end),
      ).rejects.toThrow('OpenMeteo API URL is not configured');
    });

    it('should throw error if request fails', async () => {
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');
      const lat = 52.52;
      const lon = 13.41;
      const start = new Date();
      const end = new Date();

      (fetchWeatherApi as jest.Mock).mockResolvedValue(null);

      await expect(
        client.fetchHourlyForecast(lat, lon, start, end),
      ).rejects.toThrow('Weather data fetch failed');
    });
  });

  describe('getForecast', () => {
    it('should fetch forecast and map correctly', async () => {
      const lat = 52.52;
      const lon = 13.41;
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');

      const mockHourlyVariables: Record<
        number,
        { valuesArray: () => Float32Array }
      > = {
        0: { valuesArray: () => new Float32Array([10]) }, // temperature
        1: { valuesArray: () => new Float32Array([60]) }, // humidity
        2: { valuesArray: () => new Float32Array([1]) }, // weather_code
        3: { valuesArray: () => new Float32Array([20]) }, // cloud_cover
        4: { valuesArray: () => new Float32Array([1000]) }, // surface_pressure
        5: { valuesArray: () => new Float32Array([3]) }, // uv_index
      };

      const mockDailyVariables: Record<
        number,
        { valuesArray: () => Float32Array }
      > = {
        0: { valuesArray: () => new Float32Array([2]) }, // weather_code
        1: { valuesArray: () => new Float32Array([25]) }, // temperature_2m_max
        2: { valuesArray: () => new Float32Array([15]) }, // temperature_2m_min
        3: { valuesArray: () => new Float32Array([5]) }, // precipitation_sum
      };

      const mockResponse = {
        latitude: () => lat,
        longitude: () => lon,
        timezone: () => 'UTC',
        utcOffsetSeconds: () => 0,
        hourly: () => ({
          time: () => 0,
          timeEnd: () => 3600,
          interval: () => 3600,
          variables: (index: number) => mockHourlyVariables[index],
        }),
        daily: () => ({
          time: () => 0,
          timeEnd: () => 86400,
          interval: () => 86400,
          variables: (index: number) => mockDailyVariables[index],
        }),
      };

      (fetchWeatherApi as jest.Mock).mockResolvedValue([mockResponse]);

      const result = await client.getForecast(lat, lon);

      expect(result).toEqual({
        latitude: lat,
        longitude: lon,
        timezone: 'UTC',
        hourly: [
          {
            time: new Date('1970-01-01T00:00:00.000Z'),
            temperature: 10,
            humidity: 60,
            weatherCode: 1,
            cloudCover: 20,
            surfacePressure: 1000,
            uvIndex: 3,
          },
        ],
        daily: [
          {
            date: new Date('1970-01-01T00:00:00.000Z'),
            weatherCode: 2,
            temperatureMax: 25,
            temperatureMin: 15,
            precipitationSum: 5,
          },
        ],
      });
    });

    it('should throw error if latitude or longitude is missing', async () => {
      await expect(client.getForecast(undefined, 13.41)).rejects.toThrow(
        'Latitude and Longitude must be provided',
      );
      await expect(client.getForecast(52.52, undefined)).rejects.toThrow(
        'Latitude and Longitude must be provided',
      );
    });

    it('should throw error if config is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      await expect(client.getForecast(52.52, 13.41)).rejects.toThrow(
        'OpenMeteo Archive API URL is not configured',
      );
    });

    it('should throw error if request fails', async () => {
      mockConfigService.get.mockReturnValue('https://api.open-meteo.com');
      (fetchWeatherApi as jest.Mock).mockRejectedValue(
        new Error('Fetch error'),
      );

      await expect(client.getForecast(52.52, 13.41)).rejects.toThrow(
        'Fetch error',
      );
    });
  });
});
