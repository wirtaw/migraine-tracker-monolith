// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption/encryption.service';
import { SymmetricKeyService } from './symmetric-key.service';
import { SupabaseService } from './supabase.service';
import { User, UserDocument, UserSchema } from '../users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';

const mockUser: HydratedDocument<User> = {
  userId: 'user123',
  longitude: '-74.006',
  latitude: '40.7128',
  birthDate: '1990-01-01',
  emailNotifications: true,
  dailySummary: true,
  personalHealthData: true,
  securitySetup: true,
  profileFilled: true,
} as any;

describe('AuthService', () => {
  let service: AuthService;
  let encryptionService: EncryptionService;
  let keyService: SymmetricKeyService;
  let supabaseService: SupabaseService;
  let mockUserModel: jest.Mocked<Model<UserDocument>>;
  let mockDocumentInstance: UserDocument;

  const mockEncryptionService = {
    encrypt: jest.fn(),
  };

  const mockSymmetricKeyService = {
    getKey: jest.fn(),
  };

  const mockSupabaseService = {
    client: () => ({
      auth: () => ({
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
      }),
    }),
  };

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(mockUser),
    } as unknown as UserDocument;

    mockUserModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<UserDocument>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: SymmetricKeyService,
          useValue: mockSymmetricKeyService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    keyService = module.get<SymmetricKeyService>(SymmetricKeyService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(encryptionService).toBeDefined();
    expect(keyService).toBeDefined();
    expect(supabaseService).toBeDefined();
  });
});
