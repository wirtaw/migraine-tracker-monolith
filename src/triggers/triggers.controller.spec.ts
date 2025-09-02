// src/trigger/trigger.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TriggersController } from './triggers.controller';
import { TriggersService } from './triggers.service';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { ITrigger } from './interfaces/trigger.interface'; // Ensure this path is correct
import { NotFoundException } from '@nestjs/common';

// Mock data conforming to ITrigger interface
const mockITrigger: ITrigger = {
  id: '60c72b2f9b1d8e001c8e4d3a', // String ID for ITrigger
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

// Mock the TriggersService methods
const mockTriggersService = {
  create: jest.fn().mockResolvedValue(mockITrigger),
  findAll: jest.fn().mockResolvedValue(mockITriggers),
  findOne: jest.fn().mockResolvedValue(mockITrigger),
  update: jest.fn().mockResolvedValue(mockITrigger),
  remove: jest.fn().mockResolvedValue(undefined), // remove returns void
};

describe('TriggerController', () => {
  let controller: TriggersController;
  let service: TriggersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriggersController],
      providers: [
        {
          provide: TriggersService, // Provide the mock service
          useValue: mockTriggersService,
        },
      ],
    }).compile();

    controller = module.get<TriggersController>(TriggersController);
    service = module.get<TriggersService>(TriggersService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
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
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockITrigger);
    });
  });

  describe('findAll', () => {
    it('should return an array of triggers', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockITriggers);
    });
  });

  describe('findOne', () => {
    it('should return a single trigger', async () => {
      const id = mockITrigger.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockITrigger);
    });

    it('should rethrow NotFoundException from service', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      const findOneSpy = jest.spyOn(service, 'findOne');

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(findOneSpy).toHaveBeenCalledWith(id);
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

      const result = await controller.update(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
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

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a trigger', async () => {
      const id = mockITrigger.id;
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await controller.remove(id);

      expect(removeSpy).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined(); // remove returns void (undefined)
    });

    it('should rethrow NotFoundException from service during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException());
      const removeSpy = jest.spyOn(service, 'remove');

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(removeSpy).toHaveBeenCalledWith(id);
    });
  });
});
