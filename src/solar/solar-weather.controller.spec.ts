/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SolarWeatherController } from './solar-weather.controller';
import { SolarWeatherService } from './solar-weather.service';
import { DateTime } from 'luxon';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

describe('SolarWeatherController', () => {
  let controller: SolarWeatherController;
  let solarService: SolarWeatherService;
  let module: TestingModule;

  const mockSolarService = {
    getRadiation: jest.fn(),
    getGeophysicalWeatherData: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user123' },
    session: { userId: 'user123' },
  } as unknown as RequestWithUser;

  beforeEach(async () => {
    module = await Test.createTestingModule({
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

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
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

      const result = await controller.getRadiation(lat, lon, mockRequest);

      expect(result).toEqual(mockRadiation);
      expect(solarService.getRadiation).toHaveBeenCalledWith(
        lat,
        lon,
        'user123',
      );
    });
  });

  describe('getGeophysicalWeatherData', () => {
    const mockSolarData = {
      kIndex: 2.67,
      aIndex: 12,
      solarFlux: 0,
      pastWeather: { level: '' },
      nextWeather: {
        kpIndex: {
          observed: '',
          expected: '',
          rationale: '',
        },
        solarRadiation: {
          rationale: '',
        },
        radioBlackout: {
          rationale: '',
        },
      },
    };
    it('should return geophysical historical data', async () => {
      const dt = DateTime.now().minus({ days: 6 });
      mockSolarService.getGeophysicalWeatherData.mockResolvedValue(
        mockSolarData,
      );

      const result = await controller.getGeophysicalWeatherData(
        dt.toISO(),
        mockRequest,
      );

      expect(result).toEqual(mockSolarData);
      expect(solarService.getGeophysicalWeatherData).toHaveBeenCalledWith(
        dt.toISO(),
        'user123',
      );
    });
  });
});
