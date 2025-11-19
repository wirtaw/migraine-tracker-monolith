import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RbacGuard } from './guard/rbac.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RequestWithUser } from './interfaces/auth.user.interface';
import { RoleDto } from './dto/role.dto';
import { Role } from './enums/roles.enum';
import { UnauthorizedException } from '@nestjs/common';

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
    grandRole: jest.fn().mockResolvedValue({
      message: 'Done',
    }),
    loginWithOAuth: jest.fn(),
  };

  const mockRbacGuard = {
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
      .overrideGuard(RbacGuard)
      .useValue(mockRbacGuard)
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

  describe('loginWithOAuth', () => {
    it('should call authService.loginWithOAuth with the provided DTO', async () => {
      const token = 'supabase-access-token';

      const authorizationHeader = `Bearer ${token}`;
      const loginSpy = jest.spyOn(service, 'loginWithOAuth');

      await controller.loginWithOAuth(authorizationHeader);
      expect(loginSpy).toHaveBeenCalledWith(token);
    });

    it('throw UnauthorizedException error authService.loginWithOAuth missing header', async () => {
      await expect(controller.loginWithOAuth()).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if Bearer token format is invalid', async () => {
      await expect(controller.loginWithOAuth('Bearer ')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user object from the request', () => {
      const request = {
        user: {
          userId: '123',
          username: 'testuser',
          id: '123',
          app_metadata: {
            test: 'value',
          },
          user_metadata: {
            test: 'value',
          },
          aud: '123',
        },
      };

      const result = controller.getProfile(
        request as unknown as RequestWithUser,
      );
      expect(result).toEqual(request.user);
    });
  });

  describe('grantRole', () => {
    let roleDto: RoleDto;
    let userId: string;

    beforeEach(() => {
      roleDto = {
        role: Role.USER,
      };
      userId = 'user-123';
    });
    it('should return the success message on change role', async () => {
      const grantRoleSpy = jest.spyOn(service, 'grandRole');
      const result = await controller.grantRole(userId, roleDto);

      expect(result).toStrictEqual({
        message: 'Done',
      });
      expect(grantRoleSpy).toHaveBeenCalledWith(roleDto, userId);
    });
  });
});
