/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsService } from './predictions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PredictionRule,
  PredictionRuleDocument,
} from '../schemas/prediction-rule.schema';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { RiskCalculatorService } from './risk-calculator.service';
import { WeatherService } from '../../weather/weather.service';
import { SolarWeatherService } from '../../solar/solar-weather.service';
import { IncidentsService } from '../../incidents/incidents.service';
import { OperatorEnum } from '../enums/operator.enum';
import { IForecastResponse } from '../../weather/interfaces/weather.interface';
import { IGeophysicalWeatherData } from '../../solar/interfaces/radiation.interface';
import { IIncident } from '../../incidents/interfaces/incident.interface';
import { IncidentTypeEnum } from '../../incidents/enums/incident-type.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { IRiskWeights } from '../interfaces/risk-forecast.interface';

type MockRule = Partial<PredictionRule> & {
  id?: string;
  _id?: Types.ObjectId;
};

type MockNotification = Partial<Notification> & {
  id?: string;
  _id?: Types.ObjectId;
};

const mockWeatherForecast: IForecastResponse = {
  latitude: 52.52,
  longitude: 13.41,
  timezone: 'Europe/Berlin',
  hourly: [
    {
      time: new Date('2026-02-10T12:00:00Z'),
      temperature: 22,
      humidity: 60,
      surfacePressure: 1013,
      cloudCover: 50,
      uvIndex: 5,
      weatherCode: 0,
    },
    {
      time: new Date('2026-02-10T13:00:00Z'),
      temperature: 23,
      humidity: 58,
      surfacePressure: 1012,
      cloudCover: 45,
      uvIndex: 6,
      weatherCode: 0,
    },
  ],
  daily: [],
};

const mockSolarData: IGeophysicalWeatherData = {
  kIndex: 3,
  aIndex: 12,
  solarFlux: 100,
  pastWeather: { level: 'low' },
  nextWeather: {
    kpIndex: { observed: '3', expected: '3', rationale: 'stable' },
    solarRadiation: { rationale: 'normal' },
    radioBlackout: { rationale: 'none' },
  },
};

const mockIncidents: IIncident[] = [
  {
    id: '1',
    datetimeAt: new Date('2026-02-09T10:00:00Z'),
    userId: 'user123',
    type: IncidentTypeEnum.MIGRAINE_ATTACK,
    startTime: new Date(),
    durationHours: 2,
    notes: undefined,
    triggers: [],
    createdAt: new Date(),
  },
  {
    id: '2',
    datetimeAt: new Date('2026-02-08T14:00:00Z'),
    userId: 'user123',
    type: IncidentTypeEnum.MIGRAINE_ATTACK,
    startTime: new Date(),
    durationHours: 3,
    notes: undefined,
    triggers: [],
    createdAt: new Date(),
  },
];

const mockRules: MockRule[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    userId: 'user123',
    name: 'High Pressure Alert',
    isEnabled: true,
    conditions: [
      {
        source: 'weather',
        parameter: 'pressure',
        operator: OperatorEnum.GT,
        value: 1000,
      },
    ],
    alertMessage: 'High pressure detected',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockNotifications: MockNotification[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user123',
    type: NotificationTypeEnum.PATTERN_MATCH,
    message: 'Alert message',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3c'),
    userId: 'user123',
    type: NotificationTypeEnum.RISK_ALERT,
    message: 'High risk detected',
    isRead: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('PredictionsService', () => {
  let service: PredictionsService;
  let mockRuleModel: jest.Mocked<Model<PredictionRuleDocument>>;
  let mockNotificationModel: jest.Mocked<Model<NotificationDocument>>;
  let riskCalculator: RiskCalculatorService;
  let weatherService: WeatherService;
  let solarService: SolarWeatherService;
  let incidentsService: IncidentsService;
  let module: TestingModule;

  beforeEach(async () => {
    const mockRuleDocumentInstance = {
      ...mockRules[0],
      save: jest.fn().mockResolvedValue(mockRules[0]),
    } as unknown as PredictionRuleDocument;

    mockRuleModel = jest.fn().mockImplementation(() => {
      return mockRuleDocumentInstance;
    }) as unknown as jest.Mocked<Model<PredictionRuleDocument>>;

    mockRuleModel.find = jest
      .fn()
      .mockImplementation((query?: Record<string, unknown>) => {
        const userId = query?.userId as string | undefined;
        const filtered = userId
          ? mockRules.filter((r) => r.userId === userId)
          : mockRules;
        return {
          exec: jest.fn().mockResolvedValue(filtered),
        };
      });

    mockRuleModel.create = jest
      .fn()
      .mockResolvedValue(mockRuleDocumentInstance);

    const mockNotificationDocumentInstance = {
      ...mockNotifications[0],
    } as unknown as NotificationDocument;

    mockNotificationModel = jest.fn().mockImplementation(() => {
      return mockNotificationDocumentInstance;
    }) as unknown as jest.Mocked<Model<NotificationDocument>>;

    mockNotificationModel.find = jest
      .fn()
      .mockImplementation((query?: Record<string, unknown>) => {
        const userId = query?.userId as string | undefined;
        const filtered = userId
          ? mockNotifications.filter((n) => n.userId === userId)
          : mockNotifications;
        return {
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(filtered),
        };
      });

    mockNotificationModel.findOneAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ isRead: true }),
    });

    module = await Test.createTestingModule({
      providers: [
        PredictionsService,
        {
          provide: getModelToken(PredictionRule.name),
          useValue: mockRuleModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: RiskCalculatorService,
          useValue: {
            calculateRisk: jest.fn(),
          },
        },
        {
          provide: WeatherService,
          useValue: {
            getForecast: jest.fn(),
          },
        },
        {
          provide: SolarWeatherService,
          useValue: {
            getGeophysicalWeatherData: jest.fn(),
          },
        },
        {
          provide: IncidentsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
    riskCalculator = module.get<RiskCalculatorService>(RiskCalculatorService);
    weatherService = module.get<WeatherService>(WeatherService);
    solarService = module.get<SolarWeatherService>(SolarWeatherService);
    incidentsService = module.get<IncidentsService>(IncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRiskForecast', () => {
    it('should calculate risk forecast successfully', async () => {
      jest
        .spyOn(weatherService, 'getForecast')
        .mockResolvedValue(mockWeatherForecast);
      jest
        .spyOn(solarService, 'getGeophysicalWeatherData')
        .mockResolvedValue(mockSolarData);
      jest.spyOn(incidentsService, 'findAll').mockResolvedValue(mockIncidents);
      jest.spyOn(riskCalculator, 'calculateRisk').mockReturnValue(50);

      const result = await service.getRiskForecast(
        'user123',
        52.52,
        13.41,
        'test-key',
        { weather: 0.4, solar: 0.3, history: 0.3 },
      );

      expect(result).toBeDefined();
      expect(result.dailyRisk).toBe(50);
      expect(result.hourlyRisk).toHaveLength(2);
      expect(result.factors.weather).toBeDefined();
      expect(result.factors.solar).toBeDefined();
      expect(result.factors.history).toBeDefined();
    });

    it('should use custom weights when provided', async () => {
      jest
        .spyOn(weatherService, 'getForecast')
        .mockResolvedValue(mockWeatherForecast);
      jest
        .spyOn(solarService, 'getGeophysicalWeatherData')
        .mockResolvedValue(mockSolarData);
      jest.spyOn(incidentsService, 'findAll').mockResolvedValue(mockIncidents);

      const calculateRiskSpy = jest
        .spyOn(riskCalculator, 'calculateRisk')
        .mockReturnValue(60);

      const customWeights: IRiskWeights = {
        weather: 0.4,
        solar: 0.3,
        history: 0.3,
      };

      await service.getRiskForecast(
        'user123',
        52.52,
        13.41,
        'test-key',
        customWeights,
      );

      expect(calculateRiskSpy).toHaveBeenCalledTimes(2);

      expect(calculateRiskSpy).toHaveBeenNthCalledWith(
        1,
        {
          cloudCover: 50,
          humidity: 60,
          surfacePressure: 1013,
          temperature: 22,
          time: new Date('2026-02-10T12:00:00.000Z'),
          uvIndex: 5,
          weatherCode: 0,
        },
        { kpIndex: mockSolarData.kIndex },
        mockIncidents[0].datetimeAt,
        customWeights,
      );

      expect(calculateRiskSpy).toHaveBeenNthCalledWith(
        2,
        {
          time: new Date('2026-02-10T13:00:00Z'),
          temperature: 23,
          humidity: 58,
          surfacePressure: 1012,
          cloudCover: 45,
          uvIndex: 6,
          weatherCode: 0,
        },
        { kpIndex: mockSolarData.kIndex },
        mockIncidents[0].datetimeAt,
        customWeights,
      );
    });

    it('should handle missing incidents gracefully', async () => {
      jest
        .spyOn(weatherService, 'getForecast')
        .mockResolvedValue(mockWeatherForecast);
      jest
        .spyOn(solarService, 'getGeophysicalWeatherData')
        .mockResolvedValue(mockSolarData);
      jest.spyOn(incidentsService, 'findAll').mockResolvedValue([]);
      jest.spyOn(riskCalculator, 'calculateRisk').mockReturnValue(30);

      const result = await service.getRiskForecast(
        'user123',
        52.52,
        13.41,
        'test-key',
        { weather: 0.4, solar: 0.3, history: 0.3 },
      );

      expect(result).toBeDefined();
      expect(result.factors.history.lastIncidentDate).toBeUndefined();
    });

    it('should call services with correct parameters', async () => {
      const weatherSpy = jest
        .spyOn(weatherService, 'getForecast')
        .mockResolvedValue(mockWeatherForecast);
      const solarSpy = jest
        .spyOn(solarService, 'getGeophysicalWeatherData')
        .mockResolvedValue(mockSolarData);
      const incidentsSpy = jest
        .spyOn(incidentsService, 'findAll')
        .mockResolvedValue(mockIncidents);
      jest.spyOn(riskCalculator, 'calculateRisk').mockReturnValue(40);

      const userId = 'user123';
      const latitude = 52.52;
      const longitude = 13.41;
      const encryptionKey = 'test-key';

      await service.getRiskForecast(
        userId,
        latitude,
        longitude,
        encryptionKey,
        { weather: 0.4, solar: 0.3, history: 0.3 },
      );

      expect(weatherSpy).toHaveBeenCalledWith(latitude, longitude, userId);
      expect(solarSpy).toHaveBeenCalledWith(expect.any(String), userId);
      expect(incidentsSpy).toHaveBeenCalledWith(encryptionKey, userId);
    });
  });

  describe('createRule', () => {
    it('should create a new prediction rule', async () => {
      const dto = {
        name: 'High Pressure Alert',
        conditions: [
          {
            source: 'weather' as const,
            parameter: 'pressure',
            operator: OperatorEnum.GT,
            value: 1000,
          },
        ],
        alertMessage: 'Pressure is high',
      };

      const result = await service.createRule('user123', dto);

      expect(mockRuleModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getNotifications', () => {
    it('should retrieve user notifications sorted by creation date', async () => {
      const result = await service.getNotifications('user123');

      expect(mockNotificationModel.find).toHaveBeenCalledWith({
        userId: 'user123',
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications exist', async () => {
      mockNotificationModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getNotifications('user123');

      expect(result).toEqual([]);
    });
  });

  describe('getRules', () => {
    it('should retrieve user prediction rules', async () => {
      const result = await service.getRules('user123');

      expect(mockRuleModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(result).toEqual(mockRules);
    });

    it('should return empty array when no rules exist', async () => {
      mockRuleModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getRules('user123');

      expect(result).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      await service.markNotificationAsRead('user123', 'notif1');

      expect(mockNotificationModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'notif1', userId: 'user123' },
        { isRead: true },
      );
    });

    it('should only update notifications belonging to the user', async () => {
      await service.markNotificationAsRead('user123', 'notif1');

      expect(mockNotificationModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user123' }),
        expect.any(Object),
      );
    });
  });
});
