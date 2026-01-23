/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

describe('WeatherController', () => {
  let controller: WeatherController;
  let weatherService: WeatherService;
  let module: TestingModule;

  const mockWeatherService = {
    getForecast: jest.fn(),
    getHistorical: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user123' },
    session: { userId: 'user123' },
  } as unknown as RequestWithUser;

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

  describe('getForecast', () => {
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

      mockWeatherService.getForecast.mockResolvedValue(mockForecast);

      const result = await controller.getForecast(lat, lon, mockRequest);

      expect(result).toEqual(mockForecast);
      expect(weatherService.getForecast).toHaveBeenCalledWith(
        lat,
        lon,
        'user123',
      );
    });
    it('should propagate service errors', async () => {
      mockWeatherService.getForecast.mockRejectedValue(
        new Error('Service failed'),
      );
      await expect(
        controller.getForecast(52.52, 13.41, mockRequest),
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

      mockWeatherService.getHistorical.mockResolvedValue(mockHistorical);

      const result = await controller.getHistorical(
        lat,
        lon,
        date,
        mockRequest,
      );

      expect(result).toEqual(mockHistorical);
      expect(weatherService.getHistorical).toHaveBeenCalledWith(
        lat,
        lon,
        new Date(date),
        'user123',
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
});
