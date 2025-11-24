/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { OpenMeteoClient } from './open-meteo.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse, type AxiosHeaders } from 'axios';

describe('OpenMeteoClient', () => {
  let client: OpenMeteoClient;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.open-meteo.com'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenMeteoClient,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<OpenMeteoClient>(OpenMeteoClient);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('fetchForecast', () => {
    it('should fetch forecast data', async () => {
      const lat = 52.52;
      const lon = 13.41;
      const mockData = {
        latitude: lat,
        longitude: lon,
        current_weather: {
          temperature: 20,
        },
      };

      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as unknown as AxiosHeaders,
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await client.fetchForecast(lat, lon);

      expect(result).toEqual(mockData);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/forecast',
        {
          params: {
            latitude: lat,
            longitude: lon,
            current_weather: true,
            hourly:
              'temperature_2m,relative_humidity_2m,pressure_msl,apparent_temperature,wind_speed_10m,cloud_cover',
          },
        },
      );
    });
  });
});
