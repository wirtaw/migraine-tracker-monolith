/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SolarWeatherController } from './solar-weather.controller';
import { SolarWeatherService } from './solar-weather.service';

describe('SolarWeatherController', () => {
  let controller: SolarWeatherController;
  let solarService: SolarWeatherService;

  const mockSolarService = {
    getRadiation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolarWeatherController],
      providers: [
        {
          provide: SolarWeatherService,
          useValue: mockSolarService,
        },
      ],
    }).compile();

    controller = module.get<SolarWeatherController>(SolarWeatherController);
    solarService = module.get<SolarWeatherService>(SolarWeatherService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRadiation', () => {
    it('should return solar radiation data', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const mockRadiation = {
        kp_index: 2,
        solar_wind_speed: 400,
        solar_wind_density: 5,
        estimated_kp: 2,
        source: 'GFZ',
      };

      mockSolarService.getRadiation.mockResolvedValue(mockRadiation);

      const result = await controller.getRadiation(lat, lon);

      expect(result).toEqual(mockRadiation);
      expect(solarService.getRadiation).toHaveBeenCalledWith(lat, lon);
    });
  });
});
