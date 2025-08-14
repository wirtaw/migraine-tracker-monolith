import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { NotFoundException } from '@nestjs/common';

const mockIUser: IUser = {
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
  iv: 'iv',
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
    iv: 'iv',
    fetchDataErrors: {
      forecast: 'error',
      magneticWeather: 'none',
    },
    fetchMagneticWeather: true,
    fetchWeather: true,
  },
];

const mockUserService = {
  create: jest.fn().mockResolvedValue(mockIUser),
  findAll: jest.fn().mockResolvedValue(mockIUsers),
  findOne: jest.fn().mockResolvedValue(mockIUser),
  update: jest.fn().mockResolvedValue(mockIUser),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
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
        fetchDataErrors: {
          forecast: 'error',
          magneticWeather: 'none',
        },
        fetchMagneticWeather: true,
        fetchWeather: true,
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
        fetchDataErrors: {
          forecast: 'error',
          magneticWeather: 'none',
        },
        fetchMagneticWeather: true,
        fetchWeather: true,
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
