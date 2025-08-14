import * as crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { User, UserDocument, UserSchema } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException, Logger } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

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
  salt: 'somesalt',
  encryptedSymmetricKey: 'somekey',
  iv: 'someiv',
  fetchDataErrors: {
    forecast: 'none',
    magneticWeather: 'none',
  },
  fetchMagneticWeather: true,
  fetchWeather: true,
} as any;

const mockUsers: HydratedDocument<User>[] = [
  mockUser,
  {
    userId: 'user456',
    longitude: '-118.2437',
    latitude: '34.0522',
    birthDate: '1995-05-05',
    emailNotifications: false,
    dailySummary: false,
    personalHealthData: false,
    securitySetup: false,
    profileFilled: false,
    salt: 'anothersalt',
    encryptedSymmetricKey: 'anotherkey',
    iv: 'anotheriv',
    fetchDataErrors: {
      forecast: 'error',
      magneticWeather: 'none',
    },
    fetchMagneticWeather: true,
    fetchWeather: true,
  },
] as any;

describe('UserService', () => {
  let service: UserService;
  let model: Model<UserDocument>;
  let mockUserModel: jest.Mocked<Model<UserDocument>>;
  let mockDocumentInstance: UserDocument;
  let module: TestingModule;

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(mockUser),
    } as unknown as UserDocument;

    mockUserModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<UserDocument>>;

    mockUserModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUsers),
    });
    mockUserModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    mockUserModel.create = jest.fn().mockResolvedValue(mockDocumentInstance);
    mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentInstance),
    });
    mockUserModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const dbUri =
      !process.env.MONGODB_PORT && process.env.MONGODB_CLUSTER
        ? `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_CLUSTER}`
        : `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DBNAME}?authSource=admin`;

    Logger.log(`Database URI ${dbUri}`);

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: dbUri,
          }),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [
        UserService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));

    jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      if (size === 16) return Buffer.from('somesalt-16bytes', 'utf-8');
      if (size === 12) return Buffer.from('someiv-12bytes', 'utf-8');
      if (size === 32) return Buffer.from('somemasterkey-32bytes', 'utf-8');
      return Buffer.alloc(size);
    });

    jest
      .spyOn(crypto, 'pbkdf2')
      .mockImplementation(
        (
          password,
          salt,
          iterations,
          keylen,
          digest,
          callback: (err: any, derivedKey: Buffer) => void,
        ) => {
          callback(null, Buffer.from('somederivedkey', 'utf-8'));
        },
      );

    jest.spyOn(crypto, 'createCipheriv').mockReturnValue({
      update: jest.fn().mockReturnValue(Buffer.from('encrypted-data', 'utf-8')),
      final: jest.fn().mockReturnValue(Buffer.from('', 'utf-8')),
      getAuthTag: jest.fn().mockReturnValue(Buffer.from('auth-tag', 'utf-8')),
    } as any);
  });

  afterEach(async () => {
    await model.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a user entry', async () => {
      const createDto: CreateUserDto = {
        userId: 'testUser',
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        emailNotifications: true,
        dailySummary: true,
        personalHealthData: true,
        securitySetup: true,
        profileFilled: true,
        userPassphrase: 'testpassword',
        fetchDataErrors: {
          forecast: 'none',
          magneticWeather: 'none',
        },
        fetchMagneticWeather: true,
        fetchWeather: true,
      };

      const result = await service.create(createDto);

      expect(mockUserModel).toHaveBeenCalled();
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        userId: mockUser.userId,
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: mockUser.birthDate,
        emailNotifications: mockUser.emailNotifications,
        dailySummary: mockUser.dailySummary,
        personalHealthData: mockUser.personalHealthData,
        securitySetup: mockUser.securitySetup,
        profileFilled: mockUser.profileFilled,
        salt: mockUser.salt,
        encryptedSymmetricKey: mockUser.encryptedSymmetricKey,
        iv: mockUser.iv,
        fetchDataErrors: mockUser.fetchDataErrors,
        fetchMagneticWeather: mockUser.fetchMagneticWeather,
        fetchWeather: mockUser.fetchWeather,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of user entries', async () => {
      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockUsers.map((t) => ({
          userId: t.userId,
          longitude: t.longitude,
          latitude: t.latitude,
          birthDate: t.birthDate,
          emailNotifications: t.emailNotifications,
          dailySummary: t.dailySummary,
          personalHealthData: t.personalHealthData,
          securitySetup: t.securitySetup,
          profileFilled: t.profileFilled,
          salt: t.salt,
          encryptedSymmetricKey: t.encryptedSymmetricKey,
          iv: t.iv,
          fetchDataErrors: t.fetchDataErrors,
          fetchMagneticWeather: t.fetchMagneticWeather,
          fetchWeather: t.fetchWeather,
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
        longitude: mockUser.longitude,
        latitude: mockUser.latitude,
        birthDate: mockUser.birthDate,
        emailNotifications: mockUser.emailNotifications,
        dailySummary: mockUser.dailySummary,
        personalHealthData: mockUser.personalHealthData,
        securitySetup: mockUser.securitySetup,
        profileFilled: mockUser.profileFilled,
        salt: mockUser.salt,
        encryptedSymmetricKey: mockUser.encryptedSymmetricKey,
        iv: mockUser.iv,
        fetchDataErrors: mockUser.fetchDataErrors,
        fetchMagneticWeather: mockUser.fetchMagneticWeather,
        fetchWeather: mockUser.fetchWeather,
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
  });

  describe('update', () => {
    it('should update and return the updated user entry', async () => {
      const updateDto: UpdateUserDto = {
        emailNotifications: false,
        longitude: '-118.2437',
        latitude: '34.0522',
        birthDate: '1995-05-05',
        dailySummary: false,
        personalHealthData: false,
        securitySetup: false,
        profileFilled: false,
        fetchDataErrors: {
          forecast: 'error',
          magneticWeather: 'none',
        },
        fetchMagneticWeather: true,
        fetchWeather: true,
      };
      const updatedMockUser = { ...mockUser, emailNotifications: false };
      mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockUser,
      });

      const result = await service.update(mockUser.userId, updateDto);

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUser.userId },
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        userId: updatedMockUser.userId,
        longitude: updatedMockUser.longitude,
        latitude: updatedMockUser.latitude,
        birthDate: updatedMockUser.birthDate,
        emailNotifications: updatedMockUser.emailNotifications,
        dailySummary: updatedMockUser.dailySummary,
        personalHealthData: updatedMockUser.personalHealthData,
        securitySetup: updatedMockUser.securitySetup,
        profileFilled: updatedMockUser.profileFilled,
        salt: updatedMockUser.salt,
        encryptedSymmetricKey: updatedMockUser.encryptedSymmetricKey,
        iv: updatedMockUser.iv,
        fetchDataErrors: updatedMockUser.fetchDataErrors,
        fetchMagneticWeather: updatedMockUser.fetchMagneticWeather,
        fetchWeather: updatedMockUser.fetchWeather,
      });
    });

    it('should throw NotFoundException if user entry not found during update', async () => {
      mockUserModel.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update('nonExistentUser', {
          emailNotifications: false,
          longitude: '-118.2437',
          latitude: '34.0522',
          birthDate: '1995-05-05',
          dailySummary: false,
          personalHealthData: false,
          securitySetup: false,
          profileFilled: false,
          fetchDataErrors: {
            forecast: 'error',
            magneticWeather: 'none',
          },
          fetchMagneticWeather: true,
          fetchWeather: true,
        }),
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
});
