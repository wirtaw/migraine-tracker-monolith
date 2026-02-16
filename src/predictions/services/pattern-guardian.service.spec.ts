import { Test, TestingModule } from '@nestjs/testing';
import { PatternGuardianService } from './pattern-guardian.service';
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
import { WeatherService } from '../../weather/weather.service';
import { SolarWeatherService } from '../../solar/solar-weather.service';
import { UserService } from '../../users/users.service';
import { IForecastResponse } from '../../weather/interfaces/weather.interface';
import { IGeophysicalWeatherData } from '../../solar/interfaces/radiation.interface';
import { IUser } from '../../users/interfaces/user.interface';
import { OperatorEnum } from '../enums/operator.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

type MockRule = Partial<PredictionRule> & {
  id?: string;
  _id?: Types.ObjectId;
};

type MockUser = Partial<IUser> & {
  userId: string;
};

const mockWeatherForecast: IForecastResponse = {
  latitude: 52.52,
  longitude: 13.41,
  timezone: 'Europe/Berlin',
  hourly: [
    {
      time: new Date(),
      temperature: 25,
      humidity: 65,
      surfacePressure: 1010,
      cloudCover: 50,
      uvIndex: 4,
      weatherCode: 0,
    },
  ],
  daily: [],
};

const mockSolarData: IGeophysicalWeatherData = {
  kIndex: 4,
  aIndex: 15,
  solarFlux: 100,
  pastWeather: { level: 'low' },
  nextWeather: {
    kpIndex: { observed: '4', expected: '4', rationale: 'stable' },
    solarRadiation: { rationale: 'normal' },
    radioBlackout: { rationale: 'none' },
  },
};

const mockUsers: MockUser[] = [
  {
    userId: 'user1',
    latitude: '52.52',
    longitude: '13.41',
    email: '',
    birthDate: '',
    emailNotifications: false,
    dailySummary: false,
    personalHealthData: false,
    securitySetup: false,
    profileFilled: false,
    salt: '',
    encryptedSymmetricKey: '',
    fetchDataErrors: undefined,
    fetchMagneticWeather: false,
    fetchWeather: false,
    role: 'user',
    supabaseId: '',
  },
  {
    userId: 'user2',
    latitude: '52.52',
    longitude: '13.41',
    email: '',
    birthDate: '',
    emailNotifications: false,
    dailySummary: false,
    personalHealthData: false,
    securitySetup: false,
    profileFilled: false,
    salt: '',
    encryptedSymmetricKey: '',
    fetchDataErrors: undefined,
    fetchMagneticWeather: false,
    fetchWeather: false,
    role: 'user',
    supabaseId: '',
  },
];

const mockRules: MockRule[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    userId: 'user1',
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
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user1',
    name: 'High KP Index',
    isEnabled: true,
    conditions: [
      {
        source: 'solar',
        parameter: 'kpIndex',
        operator: OperatorEnum.GTE,
        value: 4,
      },
    ],
    alertMessage: 'High solar activity',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3c'),
    userId: 'user2',
    name: 'Low Temperature',
    isEnabled: true,
    conditions: [
      {
        source: 'weather',
        parameter: 'temperature',
        operator: OperatorEnum.LT,
        value: 15,
      },
    ],
    alertMessage: 'Low temperature detected',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('PatternGuardianService', () => {
  let service: PatternGuardianService;
  let mockRuleModel: jest.Mocked<Model<PredictionRuleDocument>>;
  let mockNotificationModel: jest.Mocked<Model<NotificationDocument>>;
  let weatherService: WeatherService;
  let solarService: SolarWeatherService;
  let userService: UserService;
  let module: TestingModule;

  beforeEach(async () => {
    const mockRuleDocumentInstance = {
      ...mockRules[0],
      save: jest.fn(),
    } as unknown as PredictionRuleDocument;

    mockRuleModel = jest.fn().mockImplementation(() => {
      return mockRuleDocumentInstance;
    }) as unknown as jest.Mocked<Model<PredictionRuleDocument>>;

    mockRuleModel.find = jest
      .fn()
      .mockImplementation((query?: Record<string, unknown>) => {
        const filtered = mockRules.filter((r) => {
          if (query?.isEnabled === true) {
            return r.isEnabled === true;
          }
          return true;
        });
        return {
          exec: jest.fn().mockResolvedValue(filtered),
        };
      });

    mockRuleModel.create = jest
      .fn()
      .mockResolvedValue(mockRuleDocumentInstance);

    const mockNotificationDocumentInstance = {
      _id: new Types.ObjectId(),
      userId: 'user1',
      type: NotificationTypeEnum.PATTERN_MATCH,
      message: 'Test notification',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as NotificationDocument;

    mockNotificationModel = jest.fn().mockImplementation(() => {
      return mockNotificationDocumentInstance;
    }) as unknown as jest.Mocked<Model<NotificationDocument>>;

    mockNotificationModel.create = jest
      .fn()
      .mockResolvedValue(mockNotificationDocumentInstance);

    module = await Test.createTestingModule({
      providers: [
        PatternGuardianService,
        {
          provide: getModelToken(PredictionRule.name),
          useValue: mockRuleModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
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
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PatternGuardianService>(PatternGuardianService);
    weatherService = module.get<WeatherService>(WeatherService);
    solarService = module.get<SolarWeatherService>(SolarWeatherService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateRules', () => {
    it('should not evaluate if no enabled rules exist', async () => {
      mockRuleModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const userServiceSpy = jest.spyOn(userService, 'findAll');

      await service.evaluateRules();

      expect(userServiceSpy).not.toHaveBeenCalled();
    });

    it('should evaluate rules and create notifications for matches', async () => {
      jest
        .spyOn(userService, 'findAll')
        .mockResolvedValue(mockUsers as IUser[]);
      jest
        .spyOn(weatherService, 'getForecast')
        .mockResolvedValue(mockWeatherForecast);
      jest
        .spyOn(solarService, 'getGeophysicalWeatherData')
        .mockResolvedValue(mockSolarData);

      const notificationCreateSpy = jest.spyOn(mockNotificationModel, 'create');

      await service.evaluateRules();

      expect(notificationCreateSpy).toHaveBeenCalled();
    });

    it('should group users by location', async () => {
      const differentLocationUsers: MockUser[] = [
        ...mockUsers,
        {
          userId: 'user3',
          latitude: '40.71',
          longitude: '-74.00',
          email: '',
          birthDate: '',
          emailNotifications: false,
          dailySummary: false,
          personalHealthData: false,
          securitySetup: false,
          profileFilled: false,
          salt: '',
          encryptedSymmetricKey: '',
          fetchDataErrors: undefined,
          fetchMagneticWeather: false,
          fetchWeather: false,
          role: 'user',
          supabaseId: '',
        },
      ];

      jest
        .spyOn(userService, 'findAll')
        .mockResolvedValue(differentLocationUsers as IUser[]);

      const weatherSpy = jest
        .spyOn(weatherService, 'getForecast')
        .mockResolvedValue(mockWeatherForecast);
      jest
        .spyOn(solarService, 'getGeophysicalWeatherData')
        .mockResolvedValue(mockSolarData);

      await service.evaluateRules();

      expect(weatherSpy).toHaveBeenCalled();
    });
  });

  describe('evaluateCondition', () => {
    it('should evaluate GT operator correctly', () => {
      const result = service['evaluateCondition'](
        {
          source: 'weather',
          parameter: 'temperature',
          operator: OperatorEnum.GT,
          value: 20,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result).toBe(true);
    });

    it('should evaluate LT operator correctly', () => {
      const result = service['evaluateCondition'](
        {
          source: 'weather',
          parameter: 'temperature',
          operator: OperatorEnum.LT,
          value: 20,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result).toBe(false);
    });

    it('should evaluate EQ operator correctly', () => {
      const result = service['evaluateCondition'](
        {
          source: 'weather',
          parameter: 'temperature',
          operator: OperatorEnum.EQ,
          value: 25,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result).toBe(true);
    });

    it('should evaluate GTE operator correctly', () => {
      const result = service['evaluateCondition'](
        {
          source: 'solar',
          parameter: 'kpIndex',
          operator: OperatorEnum.GTE,
          value: 4,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result).toBe(true);
    });

    it('should evaluate LTE operator correctly', () => {
      const result = service['evaluateCondition'](
        {
          source: 'weather',
          parameter: 'humidity',
          operator: OperatorEnum.LTE,
          value: 70,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result).toBe(true);
    });
  });

  describe('getValue', () => {
    it('should extract weather temperature', () => {
      const value = service['getValue'](
        {
          source: 'weather',
          parameter: 'temperature',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(25);
    });

    it('should extract weather pressure', () => {
      const value = service['getValue'](
        {
          source: 'weather',
          parameter: 'pressure',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(1010);
    });

    it('should extract weather humidity', () => {
      const value = service['getValue'](
        {
          source: 'weather',
          parameter: 'humidity',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(65);
    });

    it('should extract weather uvIndex', () => {
      const value = service['getValue'](
        {
          source: 'weather',
          parameter: 'uvIndex',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(4);
    });

    it('should extract solar kpIndex', () => {
      const value = service['getValue'](
        {
          source: 'solar',
          parameter: 'kpIndex',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(4);
    });

    it('should extract solar aIndex', () => {
      const value = service['getValue'](
        {
          source: 'solar',
          parameter: 'aIndex',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(15);
    });

    it('should return 0 for unknown parameter', () => {
      const value = service['getValue'](
        {
          source: 'weather',
          parameter: 'unknown' as 'pressure',
          operator: OperatorEnum.GT,
          value: 0,
        },
        mockWeatherForecast,
        mockSolarData,
      );

      expect(value).toBe(0);
    });

    it('should return 0 when hourly data is empty', () => {
      const emptyForecast = { ...mockWeatherForecast, hourly: [] };
      const value = service['getValue'](
        {
          source: 'weather',
          parameter: 'temperature',
          operator: OperatorEnum.GT,
          value: 0,
        },
        emptyForecast,
        mockSolarData,
      );

      expect(value).toBe(0);
    });
  });

  describe('evaluateRule', () => {
    it('should match rule when all conditions are met', () => {
      const rule = {
        conditions: [
          {
            source: 'weather' as const,
            parameter: 'temperature' as const,
            operator: OperatorEnum.GT,
            value: 20,
          },
          {
            source: 'weather' as const,
            parameter: 'humidity' as const,
            operator: OperatorEnum.GT,
            value: 60,
          },
        ],
      } as unknown as PredictionRuleDocument;

      const result = service['evaluateRule'](
        rule,
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result.matched).toBe(true);
      expect(result.details).toHaveLength(2);
    });

    it('should not match rule when any condition fails', () => {
      const rule = {
        conditions: [
          {
            source: 'weather' as const,
            parameter: 'temperature' as const,
            operator: OperatorEnum.GT,
            value: 20,
          },
          {
            source: 'weather' as const,
            parameter: 'humidity' as const,
            operator: OperatorEnum.GT,
            value: 80,
          },
        ],
      } as unknown as PredictionRuleDocument;

      const result = service['evaluateRule'](
        rule,
        mockWeatherForecast,
        mockSolarData,
      );

      expect(result.matched).toBe(false);
      expect(result.details).toHaveLength(2);
    });
  });
});
