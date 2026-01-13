import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../auth/enums/roles.enum';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

/* eslint-disable @typescript-eslint/unbound-method */

const mockUser: HydratedDocument<User> = {
  supabaseId: 'user123',
  longitude: '-74.006',
  latitude: '40.7128',
  birthDate: '1990-01-01',
  email: 'test@mail.com',
  emailNotifications: true,
  dailySummary: true,
  personalHealthData: true,
  securitySetup: true,
  profileFilled: true,
  salt: 'somesalt',
  encryptedSymmetricKey: 'somekey',
  fetchDataErrors: {
    forecast: 'none',
    magneticWeather: 'none',
  },
  fetchMagneticWeather: true,
  fetchWeather: true,
  role: Role.USER,
} as never;

const mockDbUser: HydratedDocument<User> = {
  ...mockUser,
  longitude: 'encrypted_-74.006',
  latitude: 'encrypted_40.7128',
} as never;

const mockDbUsers: HydratedDocument<User>[] = [
  mockDbUser,
  {
    supabaseId: 'user456',
    longitude: 'encrypted_-118.2437',
    latitude: 'encrypted_34.0522',
    birthDate: '1995-05-05',
    email: 'test@mail.com',
    emailNotifications: false,
    dailySummary: false,
    personalHealthData: false,
    securitySetup: false,
    profileFilled: false,
    salt: 'anothersalt',
    encryptedSymmetricKey: 'anotherkey',
    fetchDataErrors: {
      forecast: 'error',
      magneticWeather: 'none',
    },
    fetchMagneticWeather: true,
    fetchWeather: true,
    role: Role.USER,
  },
] as never;

const mockPlainUsers: HydratedDocument<User>[] = [
  mockUser,
  {
    supabaseId: 'user456',
    longitude: '-118.2437',
    latitude: '34.0522',
    birthDate: '1995-05-05',
    email: 'test@mail.com',
    emailNotifications: false,
    dailySummary: false,
    personalHealthData: false,
    securitySetup: false,
    profileFilled: false,
    salt: 'anothersalt',
    encryptedSymmetricKey: 'anotherkey',
    fetchDataErrors: {
      forecast: 'error',
      magneticWeather: 'none',
    },
    fetchMagneticWeather: true,
    fetchWeather: true,
    role: Role.USER,
  },
] as never;

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: jest.Mocked<Model<UserDocument>>;
  let mockDocumentInstance: UserDocument;
  let module: TestingModule;

  const mockEncryptionService = {
    encryptSensitiveData: jest.fn((data) => `encrypted_${data}`),
    decryptSensitiveData: jest.fn((value: string, _key: string) => {
      if (typeof value === 'string') {
        return value.replace('encrypted_', '');
      }
      throw new Error(
        `decryptSensitiveData: expected string, got ${typeof value}`,
      );
    }),
  };

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockDbUser,
      save: jest.fn().mockResolvedValue(mockDbUser),
    } as unknown as UserDocument;

    mockUserModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<UserDocument>>;

    mockUserModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDbUsers),
    });
    mockUserModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDbUser),
    });
    mockUserModel.create = jest.fn().mockResolvedValue(mockDocumentInstance);
    mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentInstance),
    });
    mockUserModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a user entry', async () => {
      const createDto: CreateUserDto = {
        supabaseId: 'testUser',
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        email: 'test@mail.com',
      };

      const result = await service.create(createDto, 'somekey');

      expect(mockUserModel).toHaveBeenCalled();
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        userId: mockUser.userId,
        supabaseId: mockUser.supabaseId,
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: mockUser.birthDate,
        email: mockUser.email,
        emailNotifications: mockUser.emailNotifications,
        dailySummary: mockUser.dailySummary,
        personalHealthData: mockUser.personalHealthData,
        securitySetup: mockUser.securitySetup,
        profileFilled: mockUser.profileFilled,
        salt: mockUser.salt,
        encryptedSymmetricKey: mockUser.encryptedSymmetricKey,
        fetchDataErrors: mockUser.fetchDataErrors,
        fetchMagneticWeather: mockUser.fetchMagneticWeather,
        fetchWeather: mockUser.fetchWeather,
        role: Role.USER,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of user entries', async () => {
      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockPlainUsers.map((t) => ({
          userId: t.userId,
          supabaseId: t.supabaseId,
          longitude: t.longitude,
          latitude: t.latitude,
          birthDate: t.birthDate,
          email: t.email,
          emailNotifications: t.emailNotifications,
          dailySummary: t.dailySummary,
          personalHealthData: t.personalHealthData,
          securitySetup: t.securitySetup,
          profileFilled: t.profileFilled,
          salt: t.salt,
          encryptedSymmetricKey: t.encryptedSymmetricKey,
          fetchDataErrors: t.fetchDataErrors,
          fetchMagneticWeather: t.fetchMagneticWeather,
          fetchWeather: t.fetchWeather,
          role: Role.USER,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single user entry', async () => {
      const result = await service.findOne(mockUser.userId);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        userId: mockUser.userId,
      });
      expect(result).toEqual({
        userId: mockUser.userId,
        supabaseId: mockUser.supabaseId,
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: mockUser.birthDate,
        email: mockUser.email,
        emailNotifications: mockUser.emailNotifications,
        dailySummary: mockUser.dailySummary,
        personalHealthData: mockUser.personalHealthData,
        securitySetup: mockUser.securitySetup,
        profileFilled: mockUser.profileFilled,
        salt: mockUser.salt,
        encryptedSymmetricKey: mockUser.encryptedSymmetricKey,
        fetchDataErrors: mockUser.fetchDataErrors,
        fetchMagneticWeather: mockUser.fetchMagneticWeather,
        fetchWeather: mockUser.fetchWeather,
        role: Role.USER,
      });
    });

    it('should throw NotFoundException if user entry not found', async () => {
      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(service.findOne('nonExistentUser')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw Error if decrypted value is not a string', async () => {
      const invalidUser = {
        ...mockUser,
        email: 123,
      };

      mockUserModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidUser),
      });

      await expect(service.findOne(mockUser.userId)).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update and return the updated user entry', async () => {
      const email = 'anotherEmail@mail.com';
      const updateDto: UpdateUserDto = {
        emailNotifications: false,
        longitude: '-118.2437',
        latitude: '34.0522',
        birthDate: '1995-05-05',
        email,
        dailySummary: false,
        personalHealthData: false,
        securitySetup: false,
        profileFilled: false,
        role: Role.USER,
      };
      const updatedMockUser = {
        ...mockDbUser,
        emailNotifications: false,
        email,
      };
      mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockUser,
      });

      const result = await service.update(
        mockUser.userId,
        updateDto,
        'somekey',
      );

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUser.userId },
        {
          ...updateDto,
          longitude: 'encrypted_-118.2437',
          latitude: 'encrypted_34.0522',
          birthDate: `encrypted_${updateDto.birthDate}`,
          role: 'encrypted_user',
          email: `encrypted_${updateDto.email}`,
        },
        { new: true },
      );
      expect(result).toEqual({
        userId: updatedMockUser.userId,
        supabaseId: updatedMockUser.supabaseId,
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: updatedMockUser.birthDate,
        email,
        emailNotifications: updatedMockUser.emailNotifications,
        dailySummary: updatedMockUser.dailySummary,
        personalHealthData: updatedMockUser.personalHealthData,
        securitySetup: updatedMockUser.securitySetup,
        profileFilled: updatedMockUser.profileFilled,
        salt: updatedMockUser.salt,
        encryptedSymmetricKey: updatedMockUser.encryptedSymmetricKey,
        fetchDataErrors: updatedMockUser.fetchDataErrors,
        fetchMagneticWeather: updatedMockUser.fetchMagneticWeather,
        fetchWeather: updatedMockUser.fetchWeather,
        role: Role.USER,
      });
    });

    it('should throw NotFoundException if user entry not found during update', async () => {
      mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update(
          'nonExistentUser',
          {
            emailNotifications: false,
            longitude: '-118.2437',
            latitude: '34.0522',
            birthDate: '1995-05-05',
            dailySummary: false,
            personalHealthData: false,
            securitySetup: false,
            profileFilled: false,
            role: Role.USER,
          },
          'somekey',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user entry', async () => {
      mockUserModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockUser.userId);

      expect(mockUserModel.deleteOne).toHaveBeenCalledWith({
        userId: mockUser.userId,
      });
    });

    it('should throw NotFoundException if user entry not found during remove', async () => {
      mockUserModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentUser')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserModel.deleteOne).toHaveBeenCalledWith({
        userId: 'nonExistentUser',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update and return the updated user entry', async () => {
      const updateDto: UpdateUserProfileDto = {
        emailNotifications: false,
        longitude: '-118.2437',
        latitude: '34.0522',
        birthDate: '1995-05-05',
      };
      const updatedMockUser = { ...mockDbUser, emailNotifications: false };
      mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockUser,
      });

      const result = await service.updateProfile(
        mockUser.userId,
        updateDto,
        'somekey',
      );

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUser.userId },
        {
          ...updateDto,
          longitude: 'encrypted_-118.2437',
          latitude: 'encrypted_34.0522',
          birthDate: `encrypted_${updateDto.birthDate}`,
        },
        { new: true },
      );
      expect(result).toEqual({
        userId: updatedMockUser.userId,
        supabaseId: updatedMockUser.supabaseId,
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: updatedMockUser.birthDate,
        email: mockUser.email,
        emailNotifications: updatedMockUser.emailNotifications,
        dailySummary: updatedMockUser.dailySummary,
        personalHealthData: updatedMockUser.personalHealthData,
        securitySetup: updatedMockUser.securitySetup,
        profileFilled: updatedMockUser.profileFilled,
        salt: updatedMockUser.salt,
        encryptedSymmetricKey: updatedMockUser.encryptedSymmetricKey,
        fetchDataErrors: updatedMockUser.fetchDataErrors,
        fetchMagneticWeather: updatedMockUser.fetchMagneticWeather,
        fetchWeather: updatedMockUser.fetchWeather,
        role: Role.USER,
      });
    });

    it('should throw NotFoundException if user entry not found during update', async () => {
      mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.updateProfile(
          'nonExistentUser',
          {
            emailNotifications: false,
            longitude: '-118.2437',
            latitude: '34.0522',
            birthDate: '1995-05-05',
          },
          'somekey',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
