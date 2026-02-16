import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from '../services/predictions.service';
import { UserService } from '../../users/users.service';
import { IRiskForecast } from '../interfaces/risk-forecast.interface';
import { RequestWithUser } from '../../auth/interfaces/auth.user.interface';
import { CreatePredictionRuleDto } from '../dto/create-prediction-rule.dto';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { OperatorEnum } from '../enums/operator.enum';
import { IUser } from '../../users/interfaces/user.interface';
import { Role } from '../../auth/enums/roles.enum';
import { defaultRiskWeights } from '../constants/risks';

const symmetricKey = 'test-secret-key-long';
const userId = 'user123';

describe('PredictionsController', () => {
  let controller: PredictionsController;
  let service: PredictionsService;
  let userService: UserService;
  let mockRequest: RequestWithUser;

  const mockUser: IUser = {
    userId: 'user123',
    latitude: '52.52',
    longitude: '13.41',
    email: '',
    role: Role.USER,
    supabaseId: '',
    birthDate: new Date().toISOString(),
    emailNotifications: true,
    dailySummary: true,
    personalHealthData: false,
    securitySetup: false,
    profileFilled: true,
    salt: '',
    encryptedSymmetricKey: '',
    fetchMagneticWeather: false,
    fetchWeather: false,
    fetchDataErrors: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictionsController],
      providers: [
        {
          provide: PredictionsService,
          useValue: {
            getRiskForecast: jest.fn(),
            createRule: jest.fn(),
            getRules: jest.fn(),
            getNotifications: jest.fn(),
            markNotificationAsRead: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PredictionsController>(PredictionsController);
    service = module.get<PredictionsService>(PredictionsService);
    userService = module.get<UserService>(UserService);

    mockRequest = {
      session: {
        userId,
        key: symmetricKey,
      },
      user: {
        id: userId,
      },
    } as unknown as RequestWithUser;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRiskForecast', () => {
    const mockRiskForecast: IRiskForecast = {
      dailyRisk: 50,
      hourlyRisk: [
        { time: new Date(), risk: 40 },
        { time: new Date(Date.now() + 3600000), risk: 60 },
      ],
      factors: {
        weather: {
          temperature: 25,
          pressure: 1013,
          humidity: 60,
          uvIndex: 5,
        },
        solar: {
          kpIndex: 3,
          aIndex: 10,
        },
        history: {
          lastIncidentDate: new Date(Date.now() - 86400000),
        },
      },
    };

    it('should return risk forecast with provided coordinates', async () => {
      jest
        .spyOn(service, 'getRiskForecast')
        .mockResolvedValue(mockRiskForecast);

      const result = await controller.getRiskForecast(
        { latitude: 40.7128, longitude: -74.006 },
        mockRequest,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getRiskForecast).toHaveBeenCalledWith(
        userId,
        40.7128,
        -74.006,
        symmetricKey,
        defaultRiskWeights,
      );
      expect(result).toEqual(mockRiskForecast);
    });

    it('should use user location when coordinates not provided', async () => {
      jest
        .spyOn(service, 'getRiskForecast')
        .mockResolvedValue(mockRiskForecast);
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      const result = await controller.getRiskForecast({}, mockRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getRiskForecast).toHaveBeenCalledWith(
        userId,
        52.52,
        13.41,
        symmetricKey,
        defaultRiskWeights,
      );
      expect(result).toEqual(mockRiskForecast);
    });

    it('should pass custom weights to service', async () => {
      const customWeights = { weather: 50, solar: 30, history: 20 };
      jest
        .spyOn(service, 'getRiskForecast')
        .mockResolvedValue(mockRiskForecast);

      await controller.getRiskForecast(
        { latitude: 40.7128, longitude: -74.006, weights: customWeights },
        mockRequest,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getRiskForecast).toHaveBeenCalledWith(
        userId,
        40.7128,
        -74.006,
        symmetricKey,
        customWeights,
      );
    });
  });

  describe('createRule', () => {
    it('should create a prediction rule', async () => {
      const dto: CreatePredictionRuleDto = {
        name: 'High Pressure Alert',
        conditions: [
          {
            source: 'weather',
            parameter: 'pressure',
            operator: OperatorEnum.GT,
            value: 1000,
          },
        ],
        alertMessage: 'Pressure is high',
      };

      const mockRule = {
        userId,
        name: 'Rule 1',
        conditions: [],
        alertMessage: 'Alert 1',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'createRule').mockResolvedValue(mockRule);

      const result = await controller.createRule(dto, mockRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createRule).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(mockRule);
    });
  });

  describe('getRules', () => {
    it('should return user prediction rules', async () => {
      const mockRules = [
        {
          userId,
          name: 'Rule 1',
          conditions: [],
          alertMessage: 'Alert 1',
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId,
          name: 'Rule 2',
          conditions: [],
          alertMessage: 'Alert 2',
          isEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service, 'getRules').mockResolvedValue(mockRules);

      const result = await controller.getRules(mockRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getRules).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockRules);
    });

    it('should return empty array when no rules exist', async () => {
      jest.spyOn(service, 'getRules').mockResolvedValue([]);

      const result = await controller.getRules(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          userId,
          type: NotificationTypeEnum.PATTERN_MATCH,
          message: 'Alert message',
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId,
          type: NotificationTypeEnum.RISK_ALERT,
          message: 'High risk detected',
          isRead: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest
        .spyOn(service, 'getNotifications')
        .mockResolvedValue(mockNotifications);

      const result = await controller.getNotifications(mockRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getNotifications).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications exist', async () => {
      jest.spyOn(service, 'getNotifications').mockResolvedValue([]);

      const result = await controller.getNotifications(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif123';
      jest.spyOn(service, 'markNotificationAsRead').mockResolvedValue();

      await controller.markAsRead(notificationId, mockRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.markNotificationAsRead).toHaveBeenCalledWith(
        userId,
        notificationId,
      );
    });

    it('should handle marking already read notifications', async () => {
      const notificationId = 'notif123';
      jest.spyOn(service, 'markNotificationAsRead').mockResolvedValue();

      await controller.markAsRead(notificationId, mockRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.markNotificationAsRead).toHaveBeenCalledWith(
        userId,
        notificationId,
      );
    });
  });
});
