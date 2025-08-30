import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guard/supabase-auth.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RequestWithUser } from './interfaces/auth.user.interface';

const mockIUser = {
  email: 'user123@example.com',
  password: 'testPassword',
  longitude: '-74.006',
  latitude: '40.7128',
  birthDate: '1990-01-01',
  emailNotifications: true,
  dailySummary: true,
  personalHealthData: true,
};

const mockRegisterResult = {
  message: 'success',
  user: {
    userId: '1',
    email: mockIUser.email,
  },
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockRegisterResult),
    login: jest.fn(),
  };

  const mockSupabaseAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockSupabaseAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.create with the provided DTO', async () => {
      const createDto: CreateAuthDto = { ...mockIUser };

      const createSpy = jest.spyOn(service, 'register');

      const result = await controller.register(createDto);

      expect(result).toEqual(mockRegisterResult);
      expect(createSpy).toHaveBeenCalledWith(createDto);
    });
  });

  describe('login', () => {
    it('should call authService.login with the provided DTO', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginSpy = jest.spyOn(service, 'login');

      await controller.login(loginDto);
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return the user object from the request', () => {
      const request = {
        user: { userId: '123', username: 'testuser' },
      };

      const result = controller.getProfile(request as RequestWithUser);
      expect(result).toEqual(request.user);
    });
  });
});
