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
import { HydratedDocument } from 'mongoose';
import { CustomJwtService } from './jwt.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { createUserModelMock } from './mocks/createUserModelMock';
import { Role } from './enums/roles.enum';

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
} as never;

describe('AuthService', () => {
  let service: AuthService;
  let encryptionService: EncryptionService;
  let supabaseService: SupabaseService;
  let jwtService: CustomJwtService;
  let userModelConstructorSpy: jest.Mock<UserDocument, [UserInRequest]>;

  const mockEncryptionService = {
    deriveSymmetricKey: jest.fn(),
    encryptSymmetricKey: jest.fn(),
  };

  const mockSupabaseService = {
    client: {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
      },
    },
  };

  const mockJwtService = {
    signPayload: jest.fn(),
  };

  beforeEach(async () => {
    const { userModelMock: successMock } = createUserModelMock(mockUser);
    userModelConstructorSpy = successMock;
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
          provide: CustomJwtService,
          useValue: mockJwtService,
        },
        {
          provide: getModelToken('User'),
          useValue: successMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<CustomJwtService>(CustomJwtService);
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
        email: createDto.email,
        birthDate: createDto.birthDate,
        longitude: createDto.longitude,
        latitude: createDto.latitude,
        salt: expect.any(String),
        encryptedSymmetricKey,
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

      const userPayload = userModelConstructorSpy.mock.calls[0][0];

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
      const token_type = '';
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
      const token_type = '';
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
            provide: CustomJwtService,
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
      const token_type = '';
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
});
