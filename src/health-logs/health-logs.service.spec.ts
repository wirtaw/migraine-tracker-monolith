import { Test, TestingModule } from '@nestjs/testing';
import { HealthLogsService } from './health-logs.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Weight,
  WeightDocument,
  WeightSchema,
  Height,
  HeightDocument,
  HeightSchema,
  BloodPressure,
  BloodPressureDocument,
  BloodPressureSchema,
  Sleep,
  SleepDocument,
  SleepSchema,
} from './schemas/health-logs.schema';
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
import { NotFoundException, Logger } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

const mockWeight: HydratedDocument<Weight> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  weight: 75,
  notes: 'First weight log',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
} as any;

const mockHeight: HydratedDocument<Height> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
  userId: 'user123',
  height: 180,
  notes: 'Initial height',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
} as any;

const mockBloodPressure: HydratedDocument<BloodPressure> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3c'),
  userId: 'user123',
  systolic: 120,
  diastolic: 80,
  notes: 'Morning reading',
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
} as any;

const mockSleep: HydratedDocument<Sleep> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3d'),
  userId: 'user123',
  rate: 7,
  notes: 'Good sleep',
  startedAt: new Date('2023-01-01T00:00:00Z'),
  datetimeAt: new Date('2023-01-01T08:00:00Z'),
} as any;

describe('HealthLogsService', () => {
  let service: HealthLogsService;
  let weightModel: Model<WeightDocument>;
  let heightModel: Model<HeightDocument>;
  let bloodPressureModel: Model<BloodPressureDocument>;
  let sleepModel: Model<SleepDocument>;

  let mockWeightModel: jest.Mocked<Model<WeightDocument>>;
  let mockHeightModel: jest.Mocked<Model<HeightDocument>>;
  let mockBloodPressureModel: jest.Mocked<Model<BloodPressureDocument>>;
  let mockSleepModel: jest.Mocked<Model<SleepDocument>>;

  let mockWeightDocumentInstance: WeightDocument;
  let mockHeightDocumentInstance: HeightDocument;
  let mockBloodPressureDocumentInstance: BloodPressureDocument;
  let mockSleepDocumentInstance: SleepDocument;

  let module: TestingModule;

  beforeEach(async () => {
    // Mock document instances
    mockWeightDocumentInstance = {
      ...mockWeight,
      save: jest.fn().mockResolvedValue(mockWeight),
    } as unknown as WeightDocument;
    mockHeightDocumentInstance = {
      ...mockHeight,
      save: jest.fn().mockResolvedValue(mockHeight),
    } as unknown as HeightDocument;
    mockBloodPressureDocumentInstance = {
      ...mockBloodPressure,
      save: jest.fn().mockResolvedValue(mockBloodPressure),
    } as unknown as BloodPressureDocument;
    mockSleepDocumentInstance = {
      ...mockSleep,
      save: jest.fn().mockResolvedValue(mockSleep),
    } as unknown as SleepDocument;

    // Mock models with their methods
    mockWeightModel = jest
      .fn()
      .mockImplementation(
        () => mockWeightDocumentInstance,
      ) as unknown as jest.Mocked<Model<WeightDocument>>;
    mockWeightModel.find = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([mockWeight]) });
    mockWeightModel.findById = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockWeight) });
    mockWeightModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockWeightDocumentInstance),
    });
    mockWeightModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    mockHeightModel = jest
      .fn()
      .mockImplementation(
        () => mockHeightDocumentInstance,
      ) as unknown as jest.Mocked<Model<HeightDocument>>;
    mockHeightModel.find = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([mockHeight]) });
    mockHeightModel.findById = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockHeight) });
    mockHeightModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockHeightDocumentInstance),
    });
    mockHeightModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    mockBloodPressureModel = jest
      .fn()
      .mockImplementation(
        () => mockBloodPressureDocumentInstance,
      ) as unknown as jest.Mocked<Model<BloodPressureDocument>>;
    mockBloodPressureModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockBloodPressure]),
    });
    mockBloodPressureModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockBloodPressure),
    });
    mockBloodPressureModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockBloodPressureDocumentInstance),
    });
    mockBloodPressureModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    mockSleepModel = jest
      .fn()
      .mockImplementation(
        () => mockSleepDocumentInstance,
      ) as unknown as jest.Mocked<Model<SleepDocument>>;
    mockSleepModel.find = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([mockSleep]) });
    mockSleepModel.findById = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockSleep) });
    mockSleepModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSleepDocumentInstance),
    });
    mockSleepModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    let dbUri =
      !process.env.MONGODB_PORT && process.env.MONGODB_CLUSTER
        ? `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_CLUSTER}`
        : `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DBNAME}?authSource=admin`;

    Logger.log(`Database URI ${dbUri}`);

    if (process.env.MONGO_URI) {
      dbUri = process.env.MONGO_URI;
    }

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: dbUri,
          }),
        }),
        MongooseModule.forFeature([
          { name: Weight.name, schema: WeightSchema },
          { name: Height.name, schema: HeightSchema },
          { name: BloodPressure.name, schema: BloodPressureSchema },
          { name: Sleep.name, schema: SleepSchema },
        ]),
      ],
      providers: [
        HealthLogsService,
        { provide: getModelToken(Weight.name), useValue: mockWeightModel },
        { provide: getModelToken(Height.name), useValue: mockHeightModel },
        {
          provide: getModelToken(BloodPressure.name),
          useValue: mockBloodPressureModel,
        },
        { provide: getModelToken(Sleep.name), useValue: mockSleepModel },
      ],
    }).compile();

    service = module.get<HealthLogsService>(HealthLogsService);
    weightModel = module.get<Model<WeightDocument>>(getModelToken(Weight.name));
    heightModel = module.get<Model<HeightDocument>>(getModelToken(Height.name));
    bloodPressureModel = module.get<Model<BloodPressureDocument>>(
      getModelToken(BloodPressure.name),
    );
    sleepModel = module.get<Model<SleepDocument>>(getModelToken(Sleep.name));
  });

  afterEach(async () => {
    await weightModel.deleteMany({});
    await heightModel.deleteMany({});
    await bloodPressureModel.deleteMany({});
    await sleepModel.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Weight logs', () => {
    it('should create and return a weight log', async () => {
      const createDto: CreateWeightDto = {
        userId: 'testUser',
        weight: 70,
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const result = await service.createWeight(createDto);

      expect(mockWeightModel).toHaveBeenCalledWith(createDto);
      expect(mockWeightDocumentInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockWeight._id.toString(),
        userId: mockWeight.userId,
        weight: mockWeight.weight,
        notes: mockWeight.notes,
        datetimeAt: mockWeight.datetimeAt,
      });
    });

    it('should return an array of weight logs', async () => {
      const result = await service.findAllWeights();
      expect(mockWeightModel.find).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: mockWeight._id.toString(),
          userId: mockWeight.userId,
          weight: mockWeight.weight,
          notes: mockWeight.notes,
          datetimeAt: mockWeight.datetimeAt,
        },
      ]);
    });

    it('should return a single weight log', async () => {
      const result = await service.findOneWeight(mockWeight._id.toHexString());
      expect(mockWeightModel.findById).toHaveBeenCalledWith(
        mockWeight._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockWeight._id.toString(),
        userId: mockWeight.userId,
        weight: mockWeight.weight,
        notes: mockWeight.notes,
        datetimeAt: mockWeight.datetimeAt,
      });
    });

    it('should throw NotFoundException if weight log not found', async () => {
      mockWeightModel.findById = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(service.findOneWeight('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update and return the updated weight log', async () => {
      const updateDto: UpdateWeightDto = {
        weight: 71,
        notes: 'Next weight log',
        datetimeAt: new Date('2023-01-01T10:00:00Z'),
      };
      const updatedMockWeight = { ...mockWeight, notes: 'Updated notes' };
      mockWeightModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => updatedMockWeight });
      const result = await service.updateWeight(
        mockWeight._id.toHexString(),
        updateDto,
      );

      expect(mockWeightModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockWeight._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockWeight._id.toString(),
        userId: updatedMockWeight.userId,
        weight: updatedMockWeight.weight,
        notes: updatedMockWeight.notes,
        datetimeAt: updatedMockWeight.datetimeAt,
      });
    });

    it('should throw NotFoundException if weight log not found during update', async () => {
      mockWeightModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(
        service.updateWeight('nonExistentId', {
          weight: 71,
          notes: 'Next weight log',
          datetimeAt: new Date('2023-01-01T10:00:00Z'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a weight log', async () => {
      await service.removeWeight(mockWeight._id.toHexString());
      expect(mockWeightModel.deleteOne).toHaveBeenCalledWith({
        _id: mockWeight._id.toHexString(),
      });
    });

    it('should throw NotFoundException if weight log not found during remove', async () => {
      mockWeightModel.deleteOne = jest
        .fn()
        .mockReturnValue({ exec: () => Promise.resolve({ deletedCount: 0 }) });
      await expect(service.removeWeight('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Height logs', () => {
    it('should create and return a height log', async () => {
      const createDto: CreateHeightDto = {
        userId: 'testUser',
        height: 175,
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const result = await service.createHeight(createDto);

      expect(mockHeightModel).toHaveBeenCalledWith(createDto);
      expect(mockHeightDocumentInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockHeight._id.toString(),
        userId: mockHeight.userId,
        height: mockHeight.height,
        notes: mockHeight.notes,
        datetimeAt: mockHeight.datetimeAt,
      });
    });

    it('should return an array of height logs', async () => {
      const result = await service.findAllHeights();
      expect(mockHeightModel.find).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: mockHeight._id.toString(),
          userId: mockHeight.userId,
          height: mockHeight.height,
          notes: mockHeight.notes,
          datetimeAt: mockHeight.datetimeAt,
        },
      ]);
    });

    it('should return a single height log', async () => {
      const result = await service.findOneHeight(mockHeight._id.toHexString());
      expect(mockHeightModel.findById).toHaveBeenCalledWith(
        mockHeight._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockHeight._id.toString(),
        userId: mockHeight.userId,
        height: mockHeight.height,
        notes: mockHeight.notes,
        datetimeAt: mockHeight.datetimeAt,
      });
    });

    it('should throw NotFoundException if height log not found', async () => {
      mockHeightModel.findById = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(service.findOneHeight('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update and return the updated height log', async () => {
      const updateDto: UpdateHeightDto = {
        height: 176,
        notes: 'Update height',
        datetimeAt: new Date('2023-01-01T10:00:00Z'),
      };
      const updatedMockHeight = { ...mockHeight, notes: 'Updated notes' };
      mockHeightModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => updatedMockHeight });
      const result = await service.updateHeight(
        mockHeight._id.toHexString(),
        updateDto,
      );

      expect(mockHeightModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockHeight._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockHeight._id.toString(),
        userId: updatedMockHeight.userId,
        height: updatedMockHeight.height,
        notes: updatedMockHeight.notes,
        datetimeAt: updatedMockHeight.datetimeAt,
      });
    });

    it('should throw NotFoundException if height log not found during update', async () => {
      mockHeightModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(
        service.updateHeight('nonExistentId', {
          height: 176,
          notes: 'Update height',
          datetimeAt: new Date('2023-01-01T10:00:00Z'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a height log', async () => {
      await service.removeHeight(mockHeight._id.toHexString());
      expect(mockHeightModel.deleteOne).toHaveBeenCalledWith({
        _id: mockHeight._id.toHexString(),
      });
    });

    it('should throw NotFoundException if height log not found during remove', async () => {
      mockHeightModel.deleteOne = jest
        .fn()
        .mockReturnValue({ exec: () => Promise.resolve({ deletedCount: 0 }) });
      await expect(service.removeHeight('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Blood Pressure logs', () => {
    it('should create and return a blood pressure log', async () => {
      const createDto: CreateBloodPressureDto = {
        userId: 'testUser',
        systolic: 125,
        diastolic: 85,
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const result = await service.createBloodPressure(createDto);

      expect(mockBloodPressureModel).toHaveBeenCalledWith(createDto);
      expect(mockBloodPressureDocumentInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockBloodPressure._id.toString(),
        userId: mockBloodPressure.userId,
        systolic: mockBloodPressure.systolic,
        diastolic: mockBloodPressure.diastolic,
        notes: mockBloodPressure.notes,
        datetimeAt: mockBloodPressure.datetimeAt,
      });
    });

    it('should return an array of blood pressure logs', async () => {
      const result = await service.findAllBloodPressures();
      expect(mockBloodPressureModel.find).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: mockBloodPressure._id.toString(),
          userId: mockBloodPressure.userId,
          systolic: mockBloodPressure.systolic,
          diastolic: mockBloodPressure.diastolic,
          notes: mockBloodPressure.notes,
          datetimeAt: mockBloodPressure.datetimeAt,
        },
      ]);
    });

    it('should return a single blood pressure log', async () => {
      const result = await service.findOneBloodPressure(
        mockBloodPressure._id.toHexString(),
      );
      expect(mockBloodPressureModel.findById).toHaveBeenCalledWith(
        mockBloodPressure._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockBloodPressure._id.toString(),
        userId: mockBloodPressure.userId,
        systolic: mockBloodPressure.systolic,
        diastolic: mockBloodPressure.diastolic,
        notes: mockBloodPressure.notes,
        datetimeAt: mockBloodPressure.datetimeAt,
      });
    });

    it('should throw NotFoundException if blood pressure log not found', async () => {
      mockBloodPressureModel.findById = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(
        service.findOneBloodPressure('nonExistentId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return the updated blood pressure log', async () => {
      const updateDto: UpdateBloodPressureDto = {
        systolic: 130,
        diastolic: 80,
        notes: 'Update morning reading',
        datetimeAt: new Date('2023-01-01T12:00:00Z'),
      };
      const updatedMockBloodPressure = {
        ...mockBloodPressure,
        notes: 'Updated notes',
      };
      mockBloodPressureModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => updatedMockBloodPressure });
      const result = await service.updateBloodPressure(
        mockBloodPressure._id.toHexString(),
        updateDto,
      );

      expect(mockBloodPressureModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBloodPressure._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockBloodPressure._id.toString(),
        userId: updatedMockBloodPressure.userId,
        systolic: updatedMockBloodPressure.systolic,
        diastolic: updatedMockBloodPressure.diastolic,
        notes: updatedMockBloodPressure.notes,
        datetimeAt: updatedMockBloodPressure.datetimeAt,
      });
    });

    it('should throw NotFoundException if blood pressure log not found during update', async () => {
      mockBloodPressureModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(
        service.updateBloodPressure('nonExistentId', {
          systolic: 130,
          diastolic: 80,
          notes: 'Update morning reading',
          datetimeAt: new Date('2023-01-01T12:00:00Z'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a blood pressure log', async () => {
      await service.removeBloodPressure(mockBloodPressure._id.toHexString());
      expect(mockBloodPressureModel.deleteOne).toHaveBeenCalledWith({
        _id: mockBloodPressure._id.toHexString(),
      });
    });

    it('should throw NotFoundException if blood pressure log not found during remove', async () => {
      mockBloodPressureModel.deleteOne = jest
        .fn()
        .mockReturnValue({ exec: () => Promise.resolve({ deletedCount: 0 }) });
      await expect(
        service.removeBloodPressure('nonExistentId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Sleep logs', () => {
    it('should create and return a sleep log', async () => {
      const createDto: CreateSleepDto = {
        userId: 'testUser',
        rate: 8,
        notes: 'Test note',
        startedAt: new Date(),
        datetimeAt: new Date(),
      };
      const result = await service.createSleep(createDto);

      expect(mockSleepModel).toHaveBeenCalledWith(createDto);
      expect(mockSleepDocumentInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockSleep._id.toString(),
        userId: mockSleep.userId,
        rate: mockSleep.rate,
        notes: mockSleep.notes,
        startedAt: mockSleep.startedAt,
        datetimeAt: mockSleep.datetimeAt,
      });
    });

    it('should return an array of sleep logs', async () => {
      const result = await service.findAllSleeps();
      expect(mockSleepModel.find).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: mockSleep._id.toString(),
          userId: mockSleep.userId,
          rate: mockSleep.rate,
          notes: mockSleep.notes,
          startedAt: mockSleep.startedAt,
          datetimeAt: mockSleep.datetimeAt,
        },
      ]);
    });

    it('should return a single sleep log', async () => {
      const result = await service.findOneSleep(mockSleep._id.toHexString());
      expect(mockSleepModel.findById).toHaveBeenCalledWith(
        mockSleep._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockSleep._id.toString(),
        userId: mockSleep.userId,
        rate: mockSleep.rate,
        notes: mockSleep.notes,
        startedAt: mockSleep.startedAt,
        datetimeAt: mockSleep.datetimeAt,
      });
    });

    it('should throw NotFoundException if sleep log not found', async () => {
      mockSleepModel.findById = jest.fn().mockReturnValue({ exec: () => null });
      await expect(service.findOneSleep('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update and return the updated sleep log', async () => {
      const updateDto: UpdateSleepDto = {
        rate: 7,
        notes: 'Moderate sleep',
        startedAt: new Date('2023-01-01T15:00:00Z'),
        datetimeAt: new Date('2023-01-01T08:00:00Z'),
      };
      const updatedMockSleep = { ...mockSleep, notes: 'Updated notes' };
      mockSleepModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => updatedMockSleep });
      const result = await service.updateSleep(
        mockSleep._id.toHexString(),
        updateDto,
      );

      expect(mockSleepModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSleep._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockSleep._id.toString(),
        userId: updatedMockSleep.userId,
        rate: updatedMockSleep.rate,
        notes: updatedMockSleep.notes,
        startedAt: updatedMockSleep.startedAt,
        datetimeAt: updatedMockSleep.datetimeAt,
      });
    });

    it('should throw NotFoundException if sleep log not found during update', async () => {
      mockSleepModel.findByIdAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: () => null });
      await expect(
        service.updateSleep('nonExistentId', {
          rate: 7,
          notes: 'Moderate sleep',
          startedAt: new Date('2023-01-01T15:00:00Z'),
          datetimeAt: new Date('2023-01-01T08:00:00Z'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove a sleep log', async () => {
      await service.removeSleep(mockSleep._id.toHexString());
      expect(mockSleepModel.deleteOne).toHaveBeenCalledWith({
        _id: mockSleep._id.toHexString(),
      });
    });

    it('should throw NotFoundException if sleep log not found during remove', async () => {
      mockSleepModel.deleteOne = jest
        .fn()
        .mockReturnValue({ exec: () => Promise.resolve({ deletedCount: 0 }) });
      await expect(service.removeSleep('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
