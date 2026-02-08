/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';
import { GetForecastDto } from './dto/get-forecast.dto';

describe('WeatherController', () => {
  let controller: WeatherController;
  let weatherService: WeatherService;
  let module: TestingModule;

  const mockWeatherService = {
    getCurrentWeather: jest.fn(),
    getHistorical: jest.fn(),
    getForecast: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user123' },
    session: { userId: 'user123' },
  } as unknown as RequestWithUser;

  const mockForecast = {
    latitude: 52.52,
    longitude: 13.41,
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
    daily: [],
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    weatherService = module.get<WeatherService>(WeatherService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentWeather', () => {
    it('should return weather forecast', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const mockForecast = {
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

      mockWeatherService.getCurrentWeather.mockResolvedValue(mockForecast);

      const result = await controller.getCurrentWeather(lat, lon, mockRequest);

      expect(result).toEqual(mockForecast);
      expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(
        lat,
        lon,
        'user123',
      );
    });

    it('should call service with empty string if user is missing', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const mockForecast = {
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
      const reqWithoutUser = {} as RequestWithUser;

      mockWeatherService.getCurrentWeather.mockResolvedValue(mockForecast);

      const result = await controller.getCurrentWeather(
        lat,
        lon,
        reqWithoutUser,
      );

      expect(result).toEqual(mockForecast);
      expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(
        lat,
        lon,
        '',
      );
    });

    it('should propagate service errors', async () => {
      mockWeatherService.getCurrentWeather.mockRejectedValue(
        new Error('Service failed'),
      );
      await expect(
        controller.getCurrentWeather(52.52, 13.41, mockRequest),
      ).rejects.toThrow('Service failed');
    });
  });

  describe('getHistorical', () => {
    it('should return historical weather data', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const date = '2023-01-01';
      const mockHistorical = {
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
      const reqWithoutUser = {} as RequestWithUser;

      mockWeatherService.getHistorical.mockResolvedValue(mockHistorical);

      const result = await controller.getHistorical(
        lat,
        lon,
        date,
        reqWithoutUser,
      );

      expect(result).toEqual(mockHistorical);
      expect(weatherService.getHistorical).toHaveBeenCalledWith(
        lat,
        lon,
        new Date(date),
        '',
      );
    });

    it('should call service with empty string if user is missing', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const date = '2023-01-01';
      const mockHistorical = {
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
      const reqWithoutUser = {} as RequestWithUser;

      mockWeatherService.getHistorical.mockResolvedValue(mockHistorical);

      const result = await controller.getHistorical(
        lat,
        lon,
        date,
        reqWithoutUser,
      );

      expect(result).toEqual(mockHistorical);
      expect(weatherService.getHistorical).toHaveBeenCalledWith(
        lat,
        lon,
        new Date(date),
        '',
      );
    });

    it('should propagate service errors', async () => {
      mockWeatherService.getHistorical.mockRejectedValue(
        new Error('Service failed'),
      );
      await expect(
        controller.getHistorical(52.52, 13.41, '2023-01-01', mockRequest),
      ).rejects.toThrow('Service failed');
    });
  });

  describe('getForecast', () => {
    it('should call service with correct parameters', async () => {
      const dto: GetForecastDto = { latitude: 52.52, longitude: 13.41 };
      mockWeatherService.getForecast.mockResolvedValue(mockForecast);

      const result = await controller.getForecast(dto, mockRequest);

      expect(weatherService.getForecast).toHaveBeenCalledWith(
        dto.latitude,
        dto.longitude,
        'user123',
      );
      expect(result).toEqual(mockForecast);
    });

    it('should call service with empty string if user is missing', async () => {
      const dto: GetForecastDto = { latitude: 52.52, longitude: 13.41 };
      mockWeatherService.getForecast.mockResolvedValue(mockForecast);
      const reqWithoutUser = {} as RequestWithUser;

      const result = await controller.getForecast(dto, reqWithoutUser);

      expect(weatherService.getForecast).toHaveBeenCalledWith(
        dto.latitude,
        dto.longitude,
        '',
      );
      expect(result).toEqual(mockForecast);
    });
  });
});
