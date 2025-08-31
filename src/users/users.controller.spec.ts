import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase/supabase.service';
import { type User as SupaBaseUser } from '@supabase/supabase-js';

const mockIUser: IUser = {
  userId: 'user123',
  supabaseId: randomUUID(),
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
};

const mockIUsers: IUser[] = [
  mockIUser,
  {
    userId: 'user456',
    supabaseId: randomUUID(),
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
  },
];

const supaBaseUser = {
  id: mockIUser.supabaseId,
  email: 'test@mail.com',
  role: 'user',
} as SupaBaseUser;

const mockUserService = {
  create: jest.fn().mockResolvedValue(mockIUser),
  findAll: jest.fn().mockResolvedValue(mockIUsers),
  findOne: jest.fn().mockResolvedValue(mockIUser),
  update: jest.fn().mockResolvedValue(mockIUser),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockSupabaseService = {
  client: jest.fn().mockResolvedValue({}),
  getUser: jest.fn().mockResolvedValue(supaBaseUser),
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user entry and return it', async () => {
      const createDto: CreateUserDto = {
        supabaseId: 'testUser',
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        email: 'test@mail.com',
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of user entries', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockIUsers);
    });
  });

  describe('findOne', () => {
    it('should return a single user entry', async () => {
      const userId = mockIUser.userId;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(userId);

      expect(findOneSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockIUser);
    });

    it('should rethrow NotFoundException from service', async () => {
      const userId = 'nonExistentUser';
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      const findOneSpy = jest.spyOn(service, 'findOne');

      await expect(controller.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update and return the updated user entry', async () => {
      const userId = mockIUser.userId;
      const updateDto: UpdateUserDto = {
        emailNotifications: false,
        longitude: '-118.2437',
        latitude: '34.0522',
        birthDate: '1995-05-05',
        dailySummary: false,
        personalHealthData: false,
        securitySetup: false,
        profileFilled: false,
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(userId, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toEqual(mockIUser);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const userId = 'nonExistentUser';
      const updateDto: UpdateUserDto = {
        emailNotifications: false,
        longitude: '-118.2437',
        latitude: '34.0522',
        birthDate: '1995-05-05',
        dailySummary: false,
        personalHealthData: false,
        securitySetup: false,
        profileFilled: false,
      };
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new NotFoundException());
      const updateSpy = jest.spyOn(service, 'update');

      await expect(controller.update(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(updateSpy).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a user entry', async () => {
      const userId = mockIUser.userId;
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await controller.remove(userId);

      expect(removeSpy).toHaveBeenCalledWith(userId);
      expect(result).toBeUndefined();
    });

    it('should rethrow NotFoundException from service during remove', async () => {
      const userId = 'nonExistentUser';
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException());
      const removeSpy = jest.spyOn(service, 'remove');

      await expect(controller.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(removeSpy).toHaveBeenCalledWith(userId);
    });
  });
});
