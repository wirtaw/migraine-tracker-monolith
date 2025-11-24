/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

describe('WeatherController', () => {
  let controller: WeatherController;
  let weatherService: WeatherService;

  const mockWeatherService = {
    getForecast: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getForecast', () => {
    it('should return weather forecast', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const mockForecast = {
        latitude: lat,
        longitude: lon,
        current_weather: {
          temperature: 20,
          windspeed: 10,
          winddirection: 180,
          weathercode: 0,
          time: '2023-01-01T00:00',
        },
      };

      mockWeatherService.getForecast.mockResolvedValue(mockForecast);

      const result = await controller.getForecast(lat, lon);

      expect(result).toEqual(mockForecast);
      expect(weatherService.getForecast).toHaveBeenCalledWith(lat, lon);
    });
  });
});
