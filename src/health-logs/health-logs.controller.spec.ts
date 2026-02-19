/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HealthLogsController } from './health-logs.controller';
import { HealthLogsService } from './health-logs.service';
import {
  CreateWeightDto,
  CreateHeightDto,
  CreateBloodPressureDto,
  CreateSleepDto,
  CreateWaterDto,
} from './dto/create-health-logs.dto';
import {
  UpdateWeightDto,
  UpdateHeightDto,
  UpdateBloodPressureDto,
  UpdateSleepDto,
  UpdateWaterDto,
} from './dto/update-health-logs.dto';
import {
  IWeight,
  IHeight,
  IBloodPressure,
  ISleep,
  IWater,
} from './interfaces/health-logs.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';
import { NotFoundException } from '@nestjs/common';

const mockIWeight: IWeight = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  weight: 75,
  notes: 'First weight log',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
};

const mockIHeight: IHeight = {
  id: '60c72b2f9b1d8e001c8e4d3b',
  userId: 'user123',
  height: 180,
  notes: 'Initial height',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
};

const mockIBloodPressure: IBloodPressure = {
  id: '60c72b2f9b1d8e001c8e4d3c',
  userId: 'user123',
  systolic: 120,
  diastolic: 80,
  notes: 'Morning reading',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
};

const mockISleep: ISleep = {
  id: '60c72b2f9b1d8e001c8e4d3d',
  userId: 'user123',
  rate: 7,
  minutesTotal: 480,
  minutesDeep: 60,
  minutesRem: 90,
  timesWakeUp: 1,
  notes: 'Good sleep',
  startedAt: new Date('2023-01-01T00:00:00Z'),
  datetimeAt: new Date('2023-01-01T08:00:00Z'),
};

const mockIWater: IWater = {
  id: '60c72b2f9b1d8e001c8e4d3e',
  userId: 'user123',
  ml: 250,
  notes: 'First water log',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
};

const mockHealthLogsService = {
  createWeight: jest.fn().mockResolvedValue(mockIWeight),
  findAllWeights: jest.fn().mockResolvedValue([mockIWeight]),
  findOneWeight: jest.fn().mockResolvedValue(mockIWeight),
  updateWeight: jest.fn().mockResolvedValue(mockIWeight),
  removeWeight: jest.fn().mockResolvedValue(undefined),

  createHeight: jest.fn().mockResolvedValue(mockIHeight),
  findAllHeights: jest.fn().mockResolvedValue([mockIHeight]),
  findOneHeight: jest.fn().mockResolvedValue(mockIHeight),
  updateHeight: jest.fn().mockResolvedValue(mockIHeight),
  removeHeight: jest.fn().mockResolvedValue(undefined),

  createBloodPressure: jest.fn().mockResolvedValue(mockIBloodPressure),
  findAllBloodPressures: jest.fn().mockResolvedValue([mockIBloodPressure]),
  findOneBloodPressure: jest.fn().mockResolvedValue(mockIBloodPressure),
  updateBloodPressure: jest.fn().mockResolvedValue(mockIBloodPressure),
  removeBloodPressure: jest.fn().mockResolvedValue(undefined),

  createSleep: jest.fn().mockResolvedValue(mockISleep),
  findAllSleeps: jest.fn().mockResolvedValue([mockISleep]),
  findOneSleep: jest.fn().mockResolvedValue(mockISleep),
  updateSleep: jest.fn().mockResolvedValue(mockISleep),
  removeSleep: jest.fn().mockResolvedValue(undefined),
  createWater: jest.fn().mockResolvedValue(mockIWater),
  findAllWaters: jest.fn().mockResolvedValue([mockIWater]),
  findOneWater: jest.fn().mockResolvedValue(mockIWater),
  updateWater: jest.fn().mockResolvedValue(mockIWater),
  removeWater: jest.fn().mockResolvedValue(undefined),
};

const symmetricKey = 'test-secret-key-long';
const userId = 'user123';

describe('HealthLogsController', () => {
  let controller: HealthLogsController;
  let service: HealthLogsService;
  let mockRequest: RequestWithUser;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [HealthLogsController],
      providers: [
        {
          provide: HealthLogsService,
          useValue: mockHealthLogsService,
        },
        {
          provide: EncryptionService,
          useValue: {
            encryptSensitiveData: jest.fn(),
            decryptSensitiveData: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthLogsController>(HealthLogsController);
    service = module.get<HealthLogsService>(HealthLogsService);

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

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Weight Tests ---
  describe('Weight logs', () => {
    it('should create a weight log', async () => {
      const createDto: CreateWeightDto = {
        userId: 'user123',
        weight: 70,
        notes: 'Test',
        datetimeAt: new Date().toISOString(),
      };
      const result = await controller.createWeight(createDto, mockRequest);
      expect(service.createWeight).toHaveBeenCalledWith(
        createDto,
        symmetricKey,
      );
      expect(result).toEqual(mockIWeight);
    });

    it('should find all weight logs', async () => {
      const result = await controller.findAllWeights(mockRequest);
      expect(service.findAllWeights).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual([mockIWeight]);
    });

    it('should find one weight log', async () => {
      const id = mockIWeight.id;
      const result = await controller.findOneWeight(id, mockRequest);
      expect(service.findOneWeight).toHaveBeenCalledWith(
        id,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIWeight);
    });

    it('should throw NotFoundException if weight log not found', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOneWeight')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(controller.findOneWeight(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update a weight log', async () => {
      const id = mockIWeight.id;
      const updateDto: UpdateWeightDto = { weight: 72 };
      const result = await controller.updateWeight(id, updateDto, mockRequest);
      expect(service.updateWeight).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIWeight);
    });

    it('should throw NotFoundException if weight log not found during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateWeightDto = { weight: 72 };
      jest
        .spyOn(service, 'updateWeight')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.updateWeight(id, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a weight log', async () => {
      const id = mockIWeight.id;
      const result = await controller.removeWeight(id, mockRequest);
      expect(service.removeWeight).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if weight log not found during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'removeWeight')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(controller.removeWeight(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Height Tests ---
  describe('Height logs', () => {
    it('should create a height log', async () => {
      const createDto: CreateHeightDto = {
        userId: 'user123',
        height: 180,
        notes: 'Test',
        datetimeAt: new Date().toISOString(),
      };
      const result = await controller.createHeight(createDto, mockRequest);
      expect(service.createHeight).toHaveBeenCalledWith(
        createDto,
        symmetricKey,
      );
      expect(result).toEqual(mockIHeight);
    });

    it('should find all height logs', async () => {
      const result = await controller.findAllHeights(mockRequest);
      expect(service.findAllHeights).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual([mockIHeight]);
    });

    it('should find one height log', async () => {
      const id = mockIHeight.id;
      const result = await controller.findOneHeight(id, mockRequest);
      expect(service.findOneHeight).toHaveBeenCalledWith(
        id,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIHeight);
    });

    it('should throw NotFoundException if height log not found', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOneHeight')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(controller.findOneHeight(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update a height log', async () => {
      const id = mockIHeight.id;
      const updateDto: UpdateHeightDto = { height: 181 };
      const result = await controller.updateHeight(id, updateDto, mockRequest);
      expect(service.updateHeight).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIHeight);
    });

    it('should throw NotFoundException if height log not found during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateHeightDto = { height: 181 };
      jest
        .spyOn(service, 'updateHeight')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.updateHeight(id, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a height log', async () => {
      const id = mockIHeight.id;
      const result = await controller.removeHeight(id, mockRequest);
      expect(service.removeHeight).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if height log not found during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'removeHeight')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(controller.removeHeight(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Blood Pressure Tests ---
  describe('Blood Pressure logs', () => {
    it('should create a blood pressure log', async () => {
      const createDto: CreateBloodPressureDto = {
        userId: 'user123',
        systolic: 120,
        diastolic: 80,
        notes: 'Test',
        datetimeAt: new Date().toISOString(),
      };
      const result = await controller.createBloodPressure(
        createDto,
        mockRequest,
      );
      expect(service.createBloodPressure).toHaveBeenCalledWith(
        createDto,
        symmetricKey,
      );
      expect(result).toEqual(mockIBloodPressure);
    });

    it('should find all blood pressure logs', async () => {
      const result = await controller.findAllBloodPressures(mockRequest);
      expect(service.findAllBloodPressures).toHaveBeenCalledWith(
        symmetricKey,
        userId,
      );
      expect(result).toEqual([mockIBloodPressure]);
    });

    it('should find one blood pressure log', async () => {
      const id = mockIBloodPressure.id;
      const result = await controller.findOneBloodPressure(id, mockRequest);
      expect(service.findOneBloodPressure).toHaveBeenCalledWith(
        id,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIBloodPressure);
    });

    it('should throw NotFoundException if blood pressure log not found', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOneBloodPressure')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.findOneBloodPressure(id, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update a blood pressure log', async () => {
      const id = mockIBloodPressure.id;
      const updateDto: UpdateBloodPressureDto = { systolic: 125 };
      const result = await controller.updateBloodPressure(
        id,
        updateDto,
        mockRequest,
      );
      expect(service.updateBloodPressure).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIBloodPressure);
    });

    it('should throw NotFoundException if blood pressure log not found during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateBloodPressureDto = { systolic: 125 };
      jest
        .spyOn(service, 'updateBloodPressure')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.updateBloodPressure(id, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a blood pressure log', async () => {
      const id = mockIBloodPressure.id;
      const result = await controller.removeBloodPressure(id, mockRequest);
      expect(service.removeBloodPressure).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if blood pressure log not found during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'removeBloodPressure')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.removeBloodPressure(id, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --- Sleep Tests ---
  describe('Sleep logs', () => {
    it('should create a sleep log', async () => {
      const createDto: CreateSleepDto = {
        userId: 'user123',
        rate: 8,
        notes: 'Test',
        startedAt: new Date().toISOString(),
        datetimeAt: new Date().toISOString(),
      };
      const result = await controller.createSleep(createDto, mockRequest);
      expect(service.createSleep).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockISleep);
    });

    it('should find all sleep logs', async () => {
      const result = await controller.findAllSleeps(mockRequest);
      expect(service.findAllSleeps).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual([mockISleep]);
    });

    it('should find one sleep log', async () => {
      const id = mockISleep.id;
      const result = await controller.findOneSleep(id, mockRequest);
      expect(service.findOneSleep).toHaveBeenCalledWith(
        id,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockISleep);
    });

    it('should throw NotFoundException if sleep log not found', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOneSleep')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(controller.findOneSleep(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update a sleep log', async () => {
      const id = mockISleep.id;
      const updateDto: UpdateSleepDto = { rate: 9 };
      const result = await controller.updateSleep(id, updateDto, mockRequest);
      expect(service.updateSleep).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockISleep);
    });

    it('should throw NotFoundException if sleep log not found during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateSleepDto = { rate: 9 };
      jest
        .spyOn(service, 'updateSleep')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.updateSleep(id, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a sleep log', async () => {
      const id = mockISleep.id;
      const result = await controller.removeSleep(id, mockRequest);
      expect(service.removeSleep).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if sleep log not found during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'removeSleep')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(controller.removeSleep(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Water Tests ---
  describe('Water logs', () => {
    it('should create a water log', async () => {
      const createDto: CreateWaterDto = {
        userId: 'user123',
        ml: 250,
        notes: 'Test',
        datetimeAt: new Date().toISOString(),
      };
      const result = await controller.createWater(createDto, mockRequest);
      expect(service.createWater).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockIWater);
    });

    it('should find all water logs', async () => {
      const result = await controller.findAllWaters(mockRequest);
      expect(service.findAllWaters).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual([mockIWater]);
    });

    it('should find one water log', async () => {
      const id = mockIWater.id;
      const result = await controller.findOneWater(id, mockRequest);
      expect(service.findOneWater).toHaveBeenCalledWith(
        id,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIWater);
    });

    it('should update a water log', async () => {
      const id = mockIWater.id;
      const updateDto: UpdateWaterDto = { ml: 500 };
      const result = await controller.updateWater(id, updateDto, mockRequest);
      expect(service.updateWater).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIWater);
    });

    it('should remove a water log', async () => {
      const id = mockIWater.id;
      const result = await controller.removeWater(id, mockRequest);
      expect(service.removeWater).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });
  });
});
