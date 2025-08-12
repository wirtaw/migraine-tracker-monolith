import { Test, TestingModule } from '@nestjs/testing';
import { HealthLogsController } from './health-logs.controller';
import { HealthLogsService } from './health-logs.service';
import {
  CreateWeightDto,
  CreateHeightDto,
  CreateBloodPressureDto,
  CreateSleepDto,
} from './dto/create-health-logs.dto';
import {
  UpdateWeightDto,
  UpdateHeightDto,
  UpdateBloodPressureDto,
  UpdateSleepDto,
} from './dto/update-health-logs.dto';
import {
  IWeight,
  IHeight,
  IBloodPressure,
  ISleep,
} from './interfaces/health-logs.interface';

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
  notes: 'Good sleep',
  startedAt: new Date('2023-01-01T00:00:00Z'),
  datetimeAt: new Date('2023-01-01T08:00:00Z'),
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
};

describe('HealthLogsController', () => {
  let controller: HealthLogsController;
  let service: HealthLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthLogsController],
      providers: [
        {
          provide: HealthLogsService,
          useValue: mockHealthLogsService,
        },
      ],
    }).compile();

    controller = module.get<HealthLogsController>(HealthLogsController);
    service = module.get<HealthLogsService>(HealthLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Weight logs', () => {
    it('should create a weight log and return it', async () => {
      const createDto: CreateWeightDto = {
        userId: 'testUser',
        weight: 70,
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'createWeight');

      const result = await controller.createWeight(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIWeight);
    });

    it('should return an array of weight logs', async () => {
      const findAllSpy = jest.spyOn(service, 'findAllWeights');
      const result = await controller.findAllWeights();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual([mockIWeight]);
    });

    it('should return a single weight log', async () => {
      const id = mockIWeight.id;
      const findOneSpy = jest.spyOn(service, 'findOneWeight');

      const result = await controller.findOneWeight(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockIWeight);
    });

    it('should update and return the updated weight log', async () => {
      const id = mockIWeight.id;
      const updateDto: UpdateWeightDto = {
        weight: 71,
        notes: 'Next weight log',
        datetimeAt: new Date('2023-01-01T10:00:00Z'),
      };
      const updateSpy = jest.spyOn(service, 'updateWeight');

      const result = await controller.updateWeight(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockIWeight);
    });

    it('should remove a weight log', async () => {
      const id = mockIWeight.id;
      const removeSpy = jest.spyOn(service, 'removeWeight');

      const result = await controller.removeWeight(id);

      expect(removeSpy).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });

  describe('Height logs', () => {
    it('should create a height log and return it', async () => {
      const createDto: CreateHeightDto = {
        userId: 'testUser',
        height: 175,
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'createHeight');

      const result = await controller.createHeight(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIHeight);
    });

    it('should return an array of height logs', async () => {
      const findAllSpy = jest.spyOn(service, 'findAllHeights');
      const result = await controller.findAllHeights();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual([mockIHeight]);
    });

    it('should return a single height log', async () => {
      const id = mockIHeight.id;
      const findOneSpy = jest.spyOn(service, 'findOneHeight');

      const result = await controller.findOneHeight(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockIHeight);
    });

    it('should update and return the updated height log', async () => {
      const id = mockIHeight.id;
      const updateDto: UpdateHeightDto = {
        height: 176,
        notes: 'Initial height',
        datetimeAt: new Date('2023-01-01T10:00:00Z'),
      };
      const updateSpy = jest.spyOn(service, 'updateHeight');

      const result = await controller.updateHeight(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockIHeight);
    });

    it('should remove a height log', async () => {
      const id = mockIHeight.id;
      const removeSpy = jest.spyOn(service, 'removeHeight');

      const result = await controller.removeHeight(id);

      expect(removeSpy).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });

  describe('Blood Pressure logs', () => {
    it('should create a blood pressure log and return it', async () => {
      const createDto: CreateBloodPressureDto = {
        userId: 'testUser',
        systolic: 125,
        diastolic: 85,
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'createBloodPressure');

      const result = await controller.createBloodPressure(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIBloodPressure);
    });

    it('should return an array of blood pressure logs', async () => {
      const findAllSpy = jest.spyOn(service, 'findAllBloodPressures');
      const result = await controller.findAllBloodPressures();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual([mockIBloodPressure]);
    });

    it('should return a single blood pressure log', async () => {
      const id = mockIBloodPressure.id;
      const findOneSpy = jest.spyOn(service, 'findOneBloodPressure');

      const result = await controller.findOneBloodPressure(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockIBloodPressure);
    });

    it('should update and return the updated blood pressure log', async () => {
      const id = mockIBloodPressure.id;
      const updateDto: UpdateBloodPressureDto = {
        systolic: 130,
        diastolic: 80,
        notes: 'Update morning reading',
        datetimeAt: new Date('2023-01-01T12:00:00Z'),
      };
      const updateSpy = jest.spyOn(service, 'updateBloodPressure');

      const result = await controller.updateBloodPressure(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockIBloodPressure);
    });

    it('should remove a blood pressure log', async () => {
      const id = mockIBloodPressure.id;
      const removeSpy = jest.spyOn(service, 'removeBloodPressure');

      const result = await controller.removeBloodPressure(id);

      expect(removeSpy).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });

  describe('Sleep logs', () => {
    it('should create a sleep log and return it', async () => {
      const createDto: CreateSleepDto = {
        userId: 'testUser',
        rate: 8,
        notes: 'Test note',
        startedAt: new Date(),
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'createSleep');

      const result = await controller.createSleep(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockISleep);
    });

    it('should return an array of sleep logs', async () => {
      const findAllSpy = jest.spyOn(service, 'findAllSleeps');
      const result = await controller.findAllSleeps();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual([mockISleep]);
    });

    it('should return a single sleep log', async () => {
      const id = mockISleep.id;
      const findOneSpy = jest.spyOn(service, 'findOneSleep');

      const result = await controller.findOneSleep(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockISleep);
    });

    it('should update and return the updated sleep log', async () => {
      const id = mockISleep.id;
      const updateDto: UpdateSleepDto = {
        rate: 7,
        notes: 'Moderate sleep',
        startedAt: new Date('2023-01-01T15:00:00Z'),
        datetimeAt: new Date('2023-01-01T08:00:00Z'),
      };
      const updateSpy = jest.spyOn(service, 'updateSleep');

      const result = await controller.updateSleep(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockISleep);
    });

    it('should remove a sleep log', async () => {
      const id = mockISleep.id;
      const removeSpy = jest.spyOn(service, 'removeSleep');

      const result = await controller.removeSleep(id);

      expect(removeSpy).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });
});
