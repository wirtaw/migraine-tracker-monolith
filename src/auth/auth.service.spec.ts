// src/auth/auth.service.spec.ts
import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption/encryption.service';
import { SupabaseService } from './supabase/supabase.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { JwtService } from './jwt.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import {
  createUserModelMock,
  UserModelMock,
} from './mocks/createUserModelMock';
import { Role } from './enums/roles.enum';
import { RoleDto } from './dto/role.dto';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

interface UserInRequest {
  userId: string;
  supabaseId: string;
  email: string;
  birthDate: string;
  longitude: string;
  latitude: string;
  salt: string;
  encryptedSymmetricKey: string;
  role: string;
}

const mockUser: HydratedDocument<User> = {
  userId: 'user123',
  supabaseId: 'user123',
  longitude: '-74.006',
  latitude: '40.7128',
  birthDate: '1990-01-01',
  email: 'testUser@email.com',
  emailNotifications: true,
  dailySummary: true,
  personalHealthData: true,
  securitySetup: true,
  profileFilled: true,
  salt: 'somesalt-16bytes',
  encryptedSymmetricKey: 'encryptedSymmetricKey',
  role: 'user',
} as never;

describe('AuthService', () => {
  let service: AuthService;
  let encryptionService: EncryptionService;
  let supabaseService: SupabaseService;
  let jwtService: JwtService;
  let userModelConstructorSpy: UserModelMock;
  let module: TestingModule;

  const mockEncryptionService = {
    deriveSymmetricKey: jest.fn(),
    encryptSymmetricKey: jest.fn(),
    encryptSensitiveData: jest.fn(
      (value: string, _key: string) => `enc(${value})`,
    ),
    decryptSensitiveData: jest.fn((value: string, _key: string) => {
      if (typeof value === 'string') {
        return value.replace('encrypted_', '');
      }
      throw new Error(
        `decryptSensitiveData: expected string, got ${typeof value}`,
      );
    }),
  };

  const mockSupabaseService = {
    client: {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
      },
    },
    getUser: jest.fn(),
  };

  const mockJwtService = {
    signPayload: jest.fn(),
  };

  beforeEach(async () => {
    const { userModelMock: successMock } = createUserModelMock(mockUser);
    userModelConstructorSpy = successMock;
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getModelToken('User'),
          useValue: successMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      if (size === 16) return Buffer.from(mockUser.salt, 'utf-8');
      if (size === 12) return Buffer.from('someiv-12bytes', 'utf-8');
      if (size === 32) return Buffer.from('somemasterkey-32bytes', 'utf-8');
      return Buffer.alloc(size);
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(encryptionService).toBeDefined();
    expect(supabaseService).toBeDefined();
  });

  describe('register()', () => {
    let createDto: CreateAuthDto;
    const password = 'testpassword';

    beforeEach(() => {
      createDto = {
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        email: 'testUser@email.com',
        password,
      };
    });

    it('successfully register new user', async () => {
      const token = 'token';
      const encryptedSymmetricKey = 'ivhex:encryptedKeyHex:authTagHex';
      const symmetricKeyBuffer = Buffer.from('mockSymmetricKey');
      const expectedUserData: UserInRequest = {
        userId: expect.any(String),
        supabaseId: mockUser.userId,
        email: `enc(${createDto.email})`,
        birthDate: `enc(${createDto.birthDate})`,
        longitude: `enc(${createDto.longitude})`,
        latitude: `enc(${createDto.latitude})`,
        salt: expect.any(String),
        encryptedSymmetricKey,
        role: `enc(${Role.GUEST})`,
      };

      mockEncryptionService.deriveSymmetricKey.mockResolvedValueOnce(
        symmetricKeyBuffer,
      );
      mockSupabaseService.client.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: mockUser.userId, email: createDto.email } },
        error: null,
      });
      mockEncryptionService.encryptSymmetricKey.mockResolvedValueOnce(
        encryptedSymmetricKey,
      );
      mockJwtService.signPayload.mockReturnValueOnce(token);

      const result = await service.register(createDto);

      expect(result).toStrictEqual({
        message: 'User successfully registered.',
        user: {
          userId: mockUser.userId,
          email: createDto.email,
          role: Role.GUEST,
        },
        token,
      });

      expect(mockEncryptionService.deriveSymmetricKey).toHaveBeenCalledWith(
        password,
        expect.any(String),
      );

      expect(mockEncryptionService.encryptSymmetricKey).toHaveBeenCalledWith(
        symmetricKeyBuffer,
      );

      const userPayload = (userModelConstructorSpy as unknown as jest.Mock).mock
        .calls[0][0];

      expect(userPayload).toEqual(expectedUserData);

      expect(userPayload.salt).toMatch(/^[a-zA-Z0-9+/=]+$/);
      expect(userPayload.encryptedSymmetricKey).toBe(encryptedSymmetricKey);
    });

    it('failed to receive data from supabase on register new user', async () => {
      const errMessage = 'wrong API key';
      const symmetricKeyBuffer = Buffer.from('mockSymmetricKey');

      mockEncryptionService.deriveSymmetricKey.mockResolvedValueOnce(
        symmetricKeyBuffer,
      );
      mockSupabaseService.client.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: mockUser.userId, email: createDto.email } },
        error: new Error(errMessage),
      });

      await expect(service.register(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throw not found a user from supabase if it undefined on register new user', async () => {
      const symmetricKeyBuffer = Buffer.from('mockSymmetricKey');

      mockEncryptionService.deriveSymmetricKey.mockResolvedValueOnce(
        symmetricKeyBuffer,
      );
      mockSupabaseService.client.auth.signUp.mockResolvedValueOnce({
        data: { user: undefined },
        error: null,
      });

      await expect(service.register(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('failed any other exception on register new user', async () => {
      const errMessage = 'wrong API key';

      mockEncryptionService.deriveSymmetricKey.mockRejectedValue(
        new BadRequestException(errMessage),
      );

      await expect(service.register(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login()', () => {
    let loginDto: LoginDto;
    const password = 'testpassword';

    beforeEach(() => {
      loginDto = {
        email: mockUser.email,
        password,
      };
    });

    it('successfully login with existing user creds', async () => {
      const user: SupabaseUser = {
        id: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: '',
        email: loginDto.email,
        created_at: new Date().toLocaleDateString(),
      };
      const access_token = 'test';
      const refresh_token = 'test';
      const token_type = 'bearer';
      const session: Session = {
        access_token,
        refresh_token,
        expires_in: 100,
        token_type,
        user,
      };
      const token = 'token';

      mockSupabaseService.client.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user,
          session,
          weakPassword: undefined,
        },
        error: null,
      });
      mockJwtService.signPayload.mockReturnValueOnce(token);

      const result = await service.login(loginDto);

      //const userPayload = userModelConstructorSpy.mock.calls[0][0];

      //expect(userPayload).toEqual(expectedUserData);

      expect(result).toStrictEqual({
        message: 'Successfully logged in.',
        token,
        user: {
          userId: user.id,
          email: user.email,
          role: Role.GUEST,
        },
      });
    });

    it('successfully login with existing user creds without email', async () => {
      const user: SupabaseUser = {
        id: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: '',
        email: '',
        created_at: new Date().toLocaleDateString(),
      };
      const access_token = 'test';
      const refresh_token = 'test';
      const token_type = 'bearer';
      const session: Session = {
        access_token,
        refresh_token,
        expires_in: 100,
        token_type,
        user,
      };
      const token = 'token';

      mockSupabaseService.client.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user,
          session,
          weakPassword: undefined,
        },
        error: null,
      });
      mockJwtService.signPayload.mockReturnValueOnce(token);

      const result = await service.login(loginDto);

      expect(result).toStrictEqual({
        message: 'Successfully logged in.',
        token,
        user: {
          userId: user.id,
          email: '',
          role: Role.GUEST,
        },
      });
    });

    it('failed login with user creds, then got error on Supabase request', async () => {
      const errMessage = 'wrong API key';
      const user: SupabaseUser = {
        id: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: '',
        created_at: new Date().toLocaleDateString(),
      };
      const access_token = 'test';
      const refresh_token = 'test';
      const token_type = 'bearer';
      const session: Session = {
        access_token,
        refresh_token,
        expires_in: 100,
        token_type,
        user,
      };

      mockSupabaseService.client.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user,
          session,
          weakPassword: undefined,
        },
        error: new Error(errMessage),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('failed login with user creds, then doesnt got session in the Supabase data response', async () => {
      const user: SupabaseUser = {
        id: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: '',
        created_at: new Date().toLocaleDateString(),
      };

      mockSupabaseService.client.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user,
          session: undefined,
          weakPassword: undefined,
        },
        error: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('failed login with non existing user in the database', async () => {
      const { userModelMock: failedSaveMock } = createUserModelMock(mockUser, {
        findOneResult: null,
        findByIdResult: null,
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: failedSaveMock,
          },
        ],
      }).compile();

      const serviceWithFailedSaveMock = module.get<AuthService>(AuthService);

      loginDto = {
        email: 'testUser+unknown@email.com',
        password,
      };
      const user: SupabaseUser = {
        id: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: '',
        email: loginDto.email,
        created_at: new Date().toLocaleDateString(),
      };
      const access_token = 'test';
      const refresh_token = 'test';
      const token_type = 'bearer';
      const session: Session = {
        access_token,
        refresh_token,
        expires_in: 100,
        token_type,
        user,
      };
      const token = 'token';

      mockSupabaseService.client.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user,
          session,
          weakPassword: undefined,
        },
        error: null,
      });
      mockJwtService.signPayload.mockReturnValueOnce(token);

      await expect(serviceWithFailedSaveMock.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('grandRole()', () => {
    let roleDto: RoleDto;
    let userId: string;
    let serviceWithSaveMock: AuthService;

    beforeEach(async () => {
      roleDto = {
        role: Role.USER,
      };
      userId = 'user-123';
      const { userModelMock: userModelMockUpdateRole } = createUserModelMock(
        mockUser,
        {},
      );
      userModelConstructorSpy = userModelMockUpdateRole;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: userModelMockUpdateRole,
          },
        ],
      }).compile();

      serviceWithSaveMock = module.get<AuthService>(AuthService);
    });

    it('change user role', async () => {
      const result = await serviceWithSaveMock.grandRole(roleDto, userId);

      expect(result).toStrictEqual({
        message: 'Done',
      });
    });

    it('throw BadRequestException then failed change role to admin', async () => {
      await expect(
        serviceWithSaveMock.grandRole(
          {
            role: Role.ADMIN,
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throw NotFoundException then failed to update', async () => {
      const { userModelMock: userModelMockUpdateRole } = createUserModelMock(
        mockUser,
        {
          findByIdResult: null,
        },
      );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: userModelMockUpdateRole,
          },
        ],
      }).compile();

      serviceWithSaveMock = module.get<AuthService>(AuthService);

      await expect(
        serviceWithSaveMock.grandRole(roleDto, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('loginWithOAuth()', () => {
    let email: string;
    let token: string;

    beforeEach(() => {
      email = mockUser.email;
      token = 'token';
    });

    it('successfully auth exists user with Github provider', async () => {
      token = 'token';

      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUser.supabaseId, email } },
        error: null,
      });

      const symmetricKeyBuffer = Buffer.from('mockSymmetricKey');
      mockEncryptionService.deriveSymmetricKey.mockResolvedValueOnce(
        symmetricKeyBuffer,
      );

      mockJwtService.signPayload.mockReturnValueOnce(token);

      const result = await service.loginWithOAuth(token);

      expect(result).toStrictEqual({
        message: 'Successfully logged in via OAuth.',
        user: {
          userId: mockUser.supabaseId,
          email,
          role: Role.USER,
        },
        token,
      });

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledTimes(
        2,
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(
        email,
        expect.any(Buffer),
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(
        mockUser.role,
        expect.any(Buffer),
      );
    });

    it('successfully auth create user with Github provider', async () => {
      const { userModelMock: userSaveMock } = createUserModelMock(mockUser, {
        findOneResult: null,
        findByIdResult: null,
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: userSaveMock,
          },
        ],
      }).compile();

      const serviceWithUserSaveMock = module.get<AuthService>(AuthService);

      token = 'token';
      const encryptedSymmetricKey = 'ivhex:encryptedKeyHex:authTagHex';

      const symmetricKeyBuffer = Buffer.from('mockSymmetricKey');
      mockEncryptionService.deriveSymmetricKey.mockResolvedValueOnce(
        symmetricKeyBuffer,
      );
      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUser.supabaseId, email } },
        error: null,
      });
      mockEncryptionService.encryptSymmetricKey.mockResolvedValueOnce(
        encryptedSymmetricKey,
      );
      mockJwtService.signPayload.mockReturnValueOnce(token);

      const result = await serviceWithUserSaveMock.loginWithOAuth(token);

      expect(result).toStrictEqual({
        message: 'Successfully logged in via OAuth.',
        user: {
          userId: mockUser.supabaseId,
          email,
          role: Role.USER,
        },
        token,
      });

      expect(mockEncryptionService.deriveSymmetricKey).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(mockEncryptionService.encryptSymmetricKey).toHaveBeenCalledWith(
        symmetricKeyBuffer,
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledTimes(
        2,
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(
        email,
        expect.any(Buffer),
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(
        mockUser.role,
        expect.any(Buffer),
      );
    });

    it('throw UnauthorizedException error then auth user missing encryptedSymmetricKey', async () => {
      const { userModelMock: failedSaveMock } = createUserModelMock(
        {
          ...mockUser,
          encryptedSymmetricKey: '',
        },
        {},
      );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: failedSaveMock,
          },
        ],
      }).compile();

      const serviceWithFailedSaveMock = module.get<AuthService>(AuthService);

      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUser.supabaseId, email } },
        error: null,
      });

      await expect(
        serviceWithFailedSaveMock.loginWithOAuth(token),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throw UnauthorizedException auth got error', async () => {
      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('unexpected error in the OAuth2'),
      });

      await expect(service.loginWithOAuth(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throw BadRequestException auth got user without email', async () => {
      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUser.supabaseId, email: null } },
        error: null,
      });

      await expect(service.loginWithOAuth(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throw BadRequestException auth got user without supasabe user id', async () => {
      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: { id: null, email: mockUser.email } },
        error: null,
      });

      await expect(service.loginWithOAuth(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throw UnauthorizedException auth got user email and supabase are different', async () => {
      const authEmail = 'other-user-email@mail.com';
      mockSupabaseService.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUser.supabaseId, email: authEmail } },
        error: null,
      });

      const symmetricKeyBuffer = Buffer.from('mockSymmetricKey');
      mockEncryptionService.deriveSymmetricKey.mockResolvedValueOnce(
        symmetricKeyBuffer,
      );

      mockJwtService.signPayload.mockReturnValueOnce(token);

      await expect(service.loginWithOAuth(token)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledTimes(
        2,
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(
        email,
        expect.any(Buffer),
      );

      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(
        mockUser.role,
        expect.any(Buffer),
      );
    });
  });

  describe('getProfile()', () => {
    let mockUserModel: jest.Mocked<Model<UserDocument>>;
    let mockDocumentInstance: UserDocument;

    beforeEach(() => {
      mockDocumentInstance = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      } as unknown as UserDocument;

      mockUserModel = jest.fn().mockImplementation(() => {
        return mockDocumentInstance;
      }) as unknown as jest.Mocked<Model<UserDocument>>;
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
    });

    it('successfully get profile user', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: mockUserModel,
          },
        ],
      }).compile();

      const serviceWithUserSaveMock = module.get<AuthService>(AuthService);

      const expectedUserResult = {
        userId: mockUser.supabaseId,
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: mockUser.birthDate,
        email: mockUser.email,
        emailNotifications: !!mockUser?.emailNotifications,
        dailySummary: !!mockUser?.dailySummary,
        personalHealthData: !!mockUser?.personalHealthData,
        securitySetup: !!mockUser?.securitySetup,
        profileFilled: !!mockUser?.profileFilled,
        fetchDataErrors: mockUser?.fetchDataErrors || undefined,
        fetchMagneticWeather: !!mockUser?.fetchMagneticWeather,
        fetchWeather: !!mockUser?.fetchWeather,
        role: mockUser.role,
      };
      const result = await serviceWithUserSaveMock.getProfile(
        mockUser.supabaseId,
      );

      expect(result).toStrictEqual(expectedUserResult);
    });

    it('throw NotFoundException got user profile error', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: EncryptionService,
            useValue: mockEncryptionService,
          },
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getModelToken('User'),
            useValue: mockUserModel,
          },
        ],
      }).compile();

      const serviceWithUserSaveMock = module.get<AuthService>(AuthService);

      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        serviceWithUserSaveMock.getProfile(mockUser.supabaseId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
