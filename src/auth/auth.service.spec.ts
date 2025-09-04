// src/auth/auth.service.spec.ts
import * as crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption/encryption.service';
import { SupabaseService } from './supabase/supabase.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';

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
} as any;

describe('AuthService', () => {
  let service: AuthService;
  let encryptionService: EncryptionService;
  let supabaseService: SupabaseService;
  let mockDocumentInstance: UserDocument;
  let jwtService: JwtService;
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
    sign: jest.fn(),
  };

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(mockUser),
    } as unknown as UserDocument;

    userModelConstructorSpy = jest
      .fn()
      .mockImplementation(() => mockDocumentInstance);

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
          useValue: userModelConstructorSpy,
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

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(encryptionService).toBeDefined();
    expect(supabaseService).toBeDefined();
  });

  describe('register()', () => {
    it('successfully register new user', async () => {
      const password = 'testpassword';
      const token = 'token';
      const encryptedSymmetricKey = 'ivhex:encryptedKeyHex:authTagHex';
      const createDto: CreateAuthDto = {
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        email: 'testUser@email.com',
        password,
      };
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
      mockJwtService.sign.mockReturnValueOnce(token);

      const result = await service.register(createDto);

      expect(result).toStrictEqual({
        message: 'User successfully registered.',
        user: { userId: mockUser.userId, email: createDto.email },
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
  });
});
