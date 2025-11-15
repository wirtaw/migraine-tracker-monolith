import { Test, TestingModule } from '@nestjs/testing';
import { TriggersController } from './triggers.controller';
import { TriggersService } from './triggers.service';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { ITrigger } from './interfaces/trigger.interface';
import { NotFoundException } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

// Mock data conforming to ITrigger interface
const mockITrigger: ITrigger = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  type: 'Headache',
  note: 'Started after stress',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
};

const mockITriggers: ITrigger[] = [
  mockITrigger,
  {
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user456',
    type: 'Migraine',
    note: 'Visual aura',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
];

const mockTriggersService = {
  create: jest.fn().mockResolvedValue(mockITrigger),
  findAll: jest.fn().mockResolvedValue(mockITriggers),
  findOne: jest.fn().mockResolvedValue(mockITrigger),
  update: jest.fn().mockResolvedValue(mockITrigger),
  remove: jest.fn().mockResolvedValue(undefined),
};

const symmetricKey = 'test-secret-key-long';
const userId = 'user123';

describe('TriggersController', () => {
  let controller: TriggersController;
  let service: TriggersService;
  let mockRequest: RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriggersController],
      providers: [
        {
          provide: TriggersService,
          useValue: mockTriggersService,
        },
        {
          provide: EncryptionService,
          useValue: {
            encryptSensitiveData: jest.fn((v: string) => `enc(${v})`),
            decryptSensitiveData: jest.fn((v: string) =>
              v.replace(/^enc\((.*)\)$/, '$1'),
            ),
          },
        },
      ],
    }).compile();

    controller = module.get<TriggersController>(TriggersController);
    service = module.get<TriggersService>(TriggersService);

    mockRequest = {
      session: {
        userId,
        key: symmetricKey,
      },
      user: {
        id: userId,
      },
    } as unknown as RequestWithUser;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a trigger and return it', async () => {
      const createDto: CreateTriggerDto = {
        userId: 'testUser',
        type: 'TestType',
        note: 'Test note',
        datetimeAt: new Date().toISOString(),
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto, mockRequest);

      expect(createSpy).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockITrigger);
    });
  });

  describe('findAll', () => {
    it('should return an array of triggers', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll(mockRequest);

      expect(findAllSpy).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual(mockITriggers);
    });
  });

  describe('findOne', () => {
    it('should return a single trigger', async () => {
      const id = mockITrigger.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id, mockRequest);

      expect(findOneSpy).toHaveBeenCalledWith(id, symmetricKey, userId);
      expect(result).toEqual(mockITrigger);
    });

    it('should rethrow NotFoundException from service', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      const findOneSpy = jest.spyOn(service, 'findOne');

      await expect(controller.findOne(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith(id, symmetricKey, userId);
    });
  });

  describe('update', () => {
    it('should update and return the updated trigger', async () => {
      const id = mockITrigger.id;
      const updateDto: UpdateTriggerDto = {
        note: 'Updated note',
        userId: mockITrigger.userId,
        type: mockITrigger.type,
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto, mockRequest);

      expect(updateSpy).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockITrigger);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateTriggerDto = {
        note: 'test',
        userId: mockITrigger.userId,
        type: mockITrigger.type,
      };
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new NotFoundException());
      const updateSpy = jest.spyOn(service, 'update');

      await expect(
        controller.update(id, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(updateSpy).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
    });
  });

  describe('remove', () => {
    it('should remove a trigger', async () => {
      const id = mockITrigger.id;
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await controller.remove(id, mockRequest);

      expect(removeSpy).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should rethrow NotFoundException from service during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException());
      const removeSpy = jest.spyOn(service, 'remove');

      await expect(controller.remove(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(removeSpy).toHaveBeenCalledWith(id, userId);
    });
  });
});
