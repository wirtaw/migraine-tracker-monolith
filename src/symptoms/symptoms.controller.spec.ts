import { Test, TestingModule } from '@nestjs/testing';
import { SymptomsController } from './symptoms.controller';
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { ISymptom } from './interfaces/symptom.interface';
import { NotFoundException } from '@nestjs/common';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

const mockISymptom: ISymptom = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  type: 'Headache',
  severity: 5,
  note: 'Started after stress',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
};

const mockISymptoms: ISymptom[] = [
  mockISymptom,
  {
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user456',
    type: 'Migraine',
    severity: 8,
    note: 'Visual aura',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
];

const mockSymptomsService = {
  create: jest.fn().mockResolvedValue(mockISymptom),
  findAll: jest.fn().mockResolvedValue(mockISymptoms),
  findOne: jest.fn().mockResolvedValue(mockISymptom),
  update: jest.fn().mockResolvedValue(mockISymptom),
  remove: jest.fn().mockResolvedValue(undefined),
};

const symmetricKey = 'test-secret-key-long';
const userId = 'user123';

describe('SymptomsController', () => {
  let controller: SymptomsController;
  let service: SymptomsService;
  let mockRequest: RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SymptomsController],
      providers: [
        {
          provide: SymptomsService,
          useValue: mockSymptomsService,
        },
      ],
    }).compile();

    controller = module.get<SymptomsController>(SymptomsController);
    service = module.get<SymptomsService>(SymptomsService);

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
    it('should create a symptom and return it', async () => {
      const createDto: CreateSymptomDto = {
        userId: 'testUser',
        type: 'TestType',
        severity: 3,
        note: 'Test notes',
        datetimeAt: new Date().toISOString(),
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto, mockRequest);

      expect(createSpy).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockISymptom);
    });
  });

  describe('findAll', () => {
    it('should return an array of symptoms', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll(mockRequest);

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockISymptoms);
    });
  });

  describe('findOne', () => {
    it('should return a single symptom', async () => {
      const id = mockISymptom.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id, mockRequest);

      expect(findOneSpy).toHaveBeenCalledWith(id, symmetricKey, userId);
      expect(result).toEqual(mockISymptom);
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
    it('should update and return the updated symptom', async () => {
      const id = mockISymptom.id;
      const updateDto: UpdateSymptomDto = {
        note: 'Updated notes',
        userId: mockISymptom.userId,
        type: 'type2',
        severity: 10,
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto, mockRequest);

      expect(updateSpy).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockISymptom);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateSymptomDto = {
        note: 'test',
        userId: mockISymptom.userId,
        type: 'type2',
        severity: 10,
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
    it('should remove a symptom', async () => {
      const id = mockISymptom.id;
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
