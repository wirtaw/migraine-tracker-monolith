import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase/supabase.service';
import { type User as SupaBaseUser } from '@supabase/supabase-js';
import { Role } from '../auth/enums/roles.enum';

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
  role: Role.GUEST,
};

const mockIUsers: IUser[] = [mockIUser];

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

      const result: IUser | null = await controller.create(createDto);
      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIUser);
    });

    it('should throw BadRequestException for invalid input', async () => {
      const invalidDto = {} as CreateUserDto;
      jest.spyOn(service, 'create').mockImplementationOnce(() => {
        throw new BadRequestException('Invalid input');
      });

      await expect(controller.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of user entries (requires ADMIN role)', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');

      const result: IUser[] = await controller.findAll();
      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockIUsers);
    });
  });

  describe('findOne', () => {
    it('should return a single user entry', async () => {
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result: IUser | null = await controller.findOne(mockIUser.userId);

      expect(findOneSpy).toHaveBeenCalledWith(mockIUser.userId);
      expect(result).toEqual(mockIUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'findOne').mockImplementationOnce(() => {
        throw new NotFoundException('User not found');
      });

      await expect(controller.findOne('nonExistentUser')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      emailNotifications: false,
      longitude: '-118.2437',
      latitude: '34.0522',
      birthDate: '1995-05-05',
      dailySummary: false,
      personalHealthData: false,
      securitySetup: false,
      profileFilled: false,
      role: Role.COACH,
    };

    it('should update and return the updated user entry', async () => {
      const updateSpy = jest.spyOn(service, 'update');

      const result: IUser | null = await controller.update(
        mockIUser.userId,
        updateDto,
      );
      expect(updateSpy).toHaveBeenCalledWith(mockIUser.userId, updateDto);
      expect(result).toEqual(mockIUser);
    });

    it('should throw NotFoundException if user not found during update', async () => {
      jest.spyOn(service, 'update').mockImplementationOnce(() => {
        throw new NotFoundException('User not found');
      });

      await expect(
        controller.update('nonExistentUser', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid update input', async () => {
      const invalidDto = {} as UpdateUserDto;
      jest.spyOn(service, 'update').mockImplementationOnce(() => {
        throw new BadRequestException('Invalid input');
      });

      await expect(
        controller.update(mockIUser.userId, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a user entry', async () => {
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await controller.remove(mockIUser.userId);

      expect(removeSpy).toHaveBeenCalledWith(mockIUser.userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if user not found during remove', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException());
      const removeSpy = jest.spyOn(service, 'remove');

      await expect(controller.remove('nonExistentUser')).rejects.toThrow(
        NotFoundException,
      );
      expect(removeSpy).toHaveBeenCalledWith('nonExistentUser');
    });
  });
});
