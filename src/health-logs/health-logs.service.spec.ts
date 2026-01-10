import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthLogsService } from './health-logs.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Weight,
  Height,
  BloodPressure,
  Sleep,
  WeightSchema,
  HeightSchema,
  BloodPressureSchema,
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
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';

const userId = 'user123';
const otherUserId = 'user456';
const logDateTime = '2023-01-01T10:00:00.000Z';
const updatedDateTime = '2023-01-02T10:00:00.000Z';
const noteValue = 'Test note';
const updatedNote = 'Updated note';

const weightValue = 75;
const updatedWeightValue = 80;

const heightValue = 180;
const updatedHeightValue = 182;

const systolicValue = 120;
const diastolicValue = 80;
const updatedSystolic = 125;
const updatedDiastolic = 85;

const sleepRateValue = 7;
const updatedSleepRate = 8;
const startedAtValue = '2023-01-01T00:00:00.000Z';
const updatedStartedAt = '2023-01-02T00:00:00.000Z';

const mockWeight: HydratedDocument<Weight> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId,
  weight: `enc(${weightValue})`,
  notes: noteValue ? `enc(${noteValue})` : '',
  datetimeAt: `enc(${logDateTime})`,
} as never;

const mockHeight: HydratedDocument<Height> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
  userId,
  height: `enc(${heightValue})`,
  notes: noteValue ? `enc(${noteValue})` : '',
  datetimeAt: `enc(${logDateTime})`,
} as never;

const mockBloodPressure: HydratedDocument<BloodPressure> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3c'),
  userId,
  systolic: `enc(${systolicValue})`,
  diastolic: `enc(${diastolicValue})`,
  notes: noteValue ? `enc(${noteValue})` : '',
  datetimeAt: `enc(${logDateTime})`,
} as never;

const mockSleep: HydratedDocument<Sleep> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3d'),
  userId,
  rate: `enc(${sleepRateValue})`,
  notes: noteValue ? `enc(${noteValue})` : '',
  startedAt: `enc(${startedAtValue})`,
  datetimeAt: `enc(${logDateTime})`,
} as never;

type MockDoc<T> = Partial<T> & { id?: string; _id?: Types.ObjectId };

const mockWeights: MockDoc<Weight>[] = [mockWeight];
const mockHeights: MockDoc<Height>[] = [mockHeight];
const mockBloodPressures: MockDoc<BloodPressure>[] = [mockBloodPressure];
const mockSleeps: MockDoc<Sleep>[] = [mockSleep];

type MockModel<T> = jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  deleteOne: jest.Mock;
  new (dto: Partial<T>): T & { save: jest.Mock };
};

const createMockModel = <T>(data: MockDoc<T>[]): MockModel<T> => {
  const mockModel = jest.fn((dto: Partial<T>) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({
      ...dto,
      _id: new Types.ObjectId(),
    }),
  })) as unknown as MockModel<T>;

  mockModel.find = jest
    .fn()
    .mockImplementation((query: Record<string, unknown> = {}) => {
      const uid = query['userId'] as string;
      const matched = uid
        ? data.filter((d) => 'userId' in d && d.userId === uid)
        : data;
      return { exec: jest.fn().mockResolvedValue(matched) };
    });

  mockModel.findById = jest.fn().mockImplementation((id: string) => {
    const found =
      data.find((d) => d.id === id || d._id?.toHexString() === id) || null;
    return { exec: jest.fn().mockResolvedValue(found) };
  });

  mockModel.findByIdAndUpdate = jest
    .fn()
    .mockImplementation(
      (id: string, update: Partial<T>, options?: { new?: boolean }) => {
        const found = data.find(
          (d) => d.id === id || d._id?.toHexString() === id,
        );
        if (!found) return { exec: jest.fn().mockResolvedValue(null) };

        const updated = { ...found, ...update };

        if (options?.new) return { exec: jest.fn().mockResolvedValue(updated) };

        return { exec: jest.fn().mockResolvedValue(found) };
      },
    );

  mockModel.deleteOne = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  });

  return mockModel;
};

describe('HealthLogsService', () => {
  let service: HealthLogsService;
  let weightModel: Model<Weight>;
  let heightModel: Model<Height>;
  let bloodPressureModel: Model<BloodPressure>;
  let sleepModel: Model<Sleep>;
  let encryptionService: EncryptionService;
  let module: TestingModule;

  const symmetricKey = crypto.randomBytes(32).toString('hex');

  const mockEncryptionService = {
    encryptSensitiveData: jest.fn(
      (value: string, _key: Buffer) => `enc(${value})`,
    ),
    decryptSensitiveData: jest.fn((value: string, _key: Buffer) => {
      if (typeof value === 'string') {
        return value.replace(/^enc\((.*)\)$/, '$1');
      }
      throw new Error(
        `decryptSensitiveData: expected string, got ${typeof value}`,
      );
    }),
  };

  const mockWeightModel = createMockModel(mockWeights);
  const mockHeightModel = createMockModel(mockHeights);
  const mockBloodPressureModel = createMockModel(mockBloodPressures);
  const mockSleepModel = createMockModel(mockSleeps);

  beforeEach(async () => {
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
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<HealthLogsService>(HealthLogsService);
    weightModel = module.get<Model<Weight>>(getModelToken(Weight.name));
    heightModel = module.get<Model<Height>>(getModelToken(Height.name));
    bloodPressureModel = module.get<Model<BloodPressure>>(
      getModelToken(BloodPressure.name),
    );
    sleepModel = module.get<Model<Sleep>>(getModelToken(Sleep.name));
    encryptionService = module.get<EncryptionService>(EncryptionService);

    jest.clearAllMocks();
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
    expect(encryptionService).toBeDefined();
    expect(service).toBeDefined();
  });

  // ===========================================================================
  // WEIGHT TESTS
  // ===========================================================================
  describe('Weight logs', () => {
    describe('Weight logs - create', () => {
      it('should create and return a weight log', async () => {
        const createDto: CreateWeightDto = {
          userId,
          weight: 70,
          notes: noteValue,
          datetimeAt: logDateTime,
        };
        const result = await service.createWeight(createDto, symmetricKey);

        expect(mockWeightModel).toHaveBeenCalledWith(
          expect.objectContaining({
            weight: `enc(${createDto.weight})`,
            notes: `enc(${createDto.notes})`,
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.weight).toBe(70);
      });

      it('should create and return a weight log without notes', async () => {
        const createDto: CreateWeightDto = {
          userId,
          weight: 73,
          datetimeAt: logDateTime,
        };
        const result = await service.createWeight(createDto, symmetricKey);

        expect(mockWeightModel).toHaveBeenCalledWith(
          expect.objectContaining({
            weight: `enc(${createDto.weight})`,
            notes: '',
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.weight).toBe(73);
        expect(result.notes).toBeUndefined();
      });
    });

    describe('Weight logs - find', () => {
      it('should return a single weight log', async () => {
        const result = await service.findOneWeight(
          mockWeight._id.toHexString(),
          symmetricKey,
          userId,
        );
        expect(result.weight).toBe(weightValue);
      });

      it('should throw NotFoundException if user missing weight', async () => {
        await expect(
          service.findOneWeight('nonExistentId', symmetricKey, userId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch on findOne', async () => {
        await expect(
          service.findOneWeight(
            mockWeight._id.toHexString(),
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Weight logs - findAll', () => {
      it('should return an array of weight logs filtered by userId', async () => {
        const result = await service.findAllWeights(symmetricKey, userId);
        expect(mockWeightModel.find).toHaveBeenCalledWith({ userId });
        expect(result).toHaveLength(1);
        expect(result[0].weight).toBe(weightValue);
      });

      it('should return empty array for unknown user', async () => {
        const result = await service.findAllWeights(symmetricKey, otherUserId);
        expect(mockWeightModel.find).toHaveBeenCalledWith({
          userId: otherUserId,
        });
        expect(result).toHaveLength(0);
      });
    });

    describe('Weight logs - update', () => {
      it('should update and return the updated weight log (all fields)', async () => {
        const updateDto: UpdateWeightDto = {
          weight: updatedWeightValue,
          notes: updatedNote,
          datetimeAt: updatedDateTime,
        };

        const result = await service.updateWeight(
          mockWeight._id.toHexString(),
          updateDto,
          symmetricKey,
          userId,
        );

        expect(mockWeightModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockWeight._id.toHexString(),
          expect.objectContaining({
            weight: `enc(${updateDto.weight})`,
            notes: `enc(${updateDto.notes})`,
            datetimeAt: `enc(${new Date(updateDto.datetimeAt!).toISOString()})`,
          }),
          { new: true },
        );

        expect(result).toEqual(
          expect.objectContaining({
            weight: updatedWeightValue,
            notes: updatedNote,
            datetimeAt: new Date(updatedDateTime),
          }),
        );
      });

      it('should throw NotFoundException if weight log not found during update', async () => {
        mockWeightModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => null });
        await expect(
          service.updateWeight(
            'nonExistentId',
            { weight: 80 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if weight log not found after update', async () => {
        mockWeightModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockWeight });
        mockWeightModel.findByIdAndUpdate = jest
          .fn()
          .mockReturnValue({ exec: () => null });
        await expect(
          service.updateWeight(
            mockWeight._id.toHexString(),
            { weight: 80 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch during update weight log', async () => {
        mockWeightModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockWeight });
        await expect(
          service.updateWeight(
            mockWeight._id.toHexString(),
            { weight: 80 },
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Weight logs - delete', () => {
      it('should remove a weight log', async () => {
        await service.removeWeight(mockWeight._id.toHexString(), userId);
        expect(mockWeightModel.deleteOne).toHaveBeenCalledWith({
          _id: mockWeight._id.toHexString(),
          userId,
        });
      });

      it('should throw NotFoundException if weight log not found during remove', async () => {
        mockWeightModel.deleteOne = jest.fn().mockReturnValue({
          exec: () => ({
            deletedCount: 0,
          }),
        });
        await expect(
          service.removeWeight(mockWeight._id.toHexString(), userId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ===========================================================================
  // HEIGHT TESTS
  // ===========================================================================
  describe('Height logs', () => {
    describe('Height logs - create', () => {
      it('should create and return a height log', async () => {
        const createDto: CreateHeightDto = {
          userId,
          height: 175,
          notes: noteValue,
          datetimeAt: logDateTime,
        };
        const result = await service.createHeight(createDto, symmetricKey);

        expect(mockHeightModel).toHaveBeenCalledWith(
          expect.objectContaining({
            height: `enc(${createDto.height})`,
            notes: `enc(${createDto.notes})`,
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.height).toBe(175);
      });

      it('should create and return a height log without notes', async () => {
        const createDto: CreateHeightDto = {
          userId,
          height: 176,
          notes: '',
          datetimeAt: logDateTime,
        };
        const result = await service.createHeight(createDto, symmetricKey);

        expect(mockHeightModel).toHaveBeenCalledWith(
          expect.objectContaining({
            height: `enc(${createDto.height})`,
            notes: '',
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.height).toBe(176);
        expect(result.notes).toBeUndefined();
      });
    });

    describe('Height logs - find', () => {
      it('should return a single height log', async () => {
        const result = await service.findOneHeight(
          mockHeight._id.toHexString(),
          symmetricKey,
          userId,
        );
        expect(result.height).toBe(heightValue);
      });

      it('should throw NotFoundException if user missing height', async () => {
        await expect(
          service.findOneHeight('nonExistentId', symmetricKey, userId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch on findOne', async () => {
        await expect(
          service.findOneHeight(
            mockHeight._id.toHexString(),
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Height logs - findAll', () => {
      it('should return an array of height logs filtered by userId', async () => {
        const result = await service.findAllHeights(symmetricKey, userId);
        expect(mockHeightModel.find).toHaveBeenCalledWith({ userId });
        expect(result).toHaveLength(1);
        expect(result[0].height).toBe(heightValue);
      });

      it('should return empty array for unknown user', async () => {
        const result = await service.findAllHeights(symmetricKey, otherUserId);
        expect(mockHeightModel.find).toHaveBeenCalledWith({
          userId: otherUserId,
        });
        expect(result).toHaveLength(0);
      });
    });

    describe('Height logs - update', () => {
      it('should update and return the updated height log (all fields)', async () => {
        const updateDto: UpdateHeightDto = {
          height: updatedHeightValue,
          notes: updatedNote,
          datetimeAt: updatedDateTime,
        };

        const result = await service.updateHeight(
          mockHeight._id.toHexString(),
          updateDto,
          symmetricKey,
          userId,
        );

        expect(mockHeightModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockHeight._id.toHexString(),
          expect.objectContaining({
            height: `enc(${updateDto.height})`,
            notes: `enc(${updateDto.notes})`,
            datetimeAt: `enc(${new Date(updateDto.datetimeAt!).toISOString()})`,
          }),
          { new: true },
        );

        expect(result).toEqual(
          expect.objectContaining({
            height: updatedHeightValue,
            notes: updatedNote,
            datetimeAt: new Date(updatedDateTime),
          }),
        );
      });

      it('should throw NotFoundException if height log not found during update', async () => {
        mockHeightModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => null });
        await expect(
          service.updateHeight(
            'nonExistentId',
            { height: 80 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if height log not found after update', async () => {
        mockHeightModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockHeight });

        mockHeightModel.findByIdAndUpdate = jest
          .fn()
          .mockReturnValue({ exec: () => null });

        await expect(
          service.updateHeight(
            mockHeight._id.toHexString(),
            { height: 80 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch during update height log', async () => {
        mockHeightModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockHeight });
        await expect(
          service.updateHeight(
            mockWeight._id.toHexString(),
            { height: 80 },
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Height logs - delete', () => {
      it('should remove a height log', async () => {
        await service.removeHeight(mockHeight._id.toHexString(), userId);
        expect(mockHeightModel.deleteOne).toHaveBeenCalledWith({
          _id: mockHeight._id.toHexString(),
          userId,
        });
      });
      it('should throw NotFoundException if height log not found during remove', async () => {
        mockHeightModel.deleteOne = jest.fn().mockReturnValue({
          exec: () => ({
            deletedCount: 0,
          }),
        });
        await expect(
          service.removeHeight(mockHeight._id.toHexString(), userId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ===========================================================================
  // BLOOD PRESSURE TESTS
  // ===========================================================================
  describe('Blood Pressure logs', () => {
    describe('Blood Pressure logs - create', () => {
      it('should create and return a blood pressure log', async () => {
        const createDto: CreateBloodPressureDto = {
          userId,
          systolic: 110,
          diastolic: 70,
          notes: noteValue,
          datetimeAt: logDateTime,
        };
        const result = await service.createBloodPressure(
          createDto,
          symmetricKey,
        );

        expect(mockBloodPressureModel).toHaveBeenCalledWith(
          expect.objectContaining({
            systolic: `enc(${createDto.systolic})`,
            diastolic: `enc(${createDto.diastolic})`,
            notes: `enc(${createDto.notes})`,
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.systolic).toBe(110);
      });

      it('should create and return a blood pressure log without notes', async () => {
        const createDto: CreateBloodPressureDto = {
          userId,
          systolic: 130,
          diastolic: 40,
          datetimeAt: logDateTime,
        };
        const result = await service.createBloodPressure(
          createDto,
          symmetricKey,
        );

        expect(mockBloodPressureModel).toHaveBeenCalledWith(
          expect.objectContaining({
            systolic: `enc(${createDto.systolic})`,
            diastolic: `enc(${createDto.diastolic})`,
            notes: '',
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.systolic).toBe(130);
        expect(result.diastolic).toBe(40);
        expect(result.notes).toBeUndefined();
      });
    });

    describe('Blood Pressure logs - find', () => {
      it('should return a single blood pressure log', async () => {
        const result = await service.findOneBloodPressure(
          mockBloodPressure._id.toHexString(),
          symmetricKey,
          userId,
        );
        expect(result.systolic).toBe(systolicValue);
      });

      it('should throw NotFoundException if user missing blood pressure', async () => {
        await expect(
          service.findOneBloodPressure('nonExistentId', symmetricKey, userId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch on findOne', async () => {
        await expect(
          service.findOneBloodPressure(
            mockBloodPressure._id.toHexString(),
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Blood Pressure logs - findAll', () => {
      it('should return an array of blood pressure logs filtered by userId', async () => {
        const result = await service.findAllBloodPressures(
          symmetricKey,
          userId,
        );
        expect(mockBloodPressureModel.find).toHaveBeenCalledWith({ userId });
        expect(result).toHaveLength(1);
        expect(result[0].systolic).toBe(systolicValue);
      });

      it('should return empty array for unknown user', async () => {
        const result = await service.findAllBloodPressures(
          symmetricKey,
          otherUserId,
        );
        expect(mockBloodPressureModel.find).toHaveBeenCalledWith({
          userId: otherUserId,
        });
        expect(result).toHaveLength(0);
      });
    });

    describe('Blood Pressure logs - update', () => {
      it('should update and return the updated blood pressure log (all fields)', async () => {
        const updateDto: UpdateBloodPressureDto = {
          systolic: updatedSystolic,
          diastolic: updatedDiastolic,
          notes: updatedNote,
          datetimeAt: updatedDateTime,
        };

        const result = await service.updateBloodPressure(
          mockBloodPressure._id.toHexString(),
          updateDto,
          symmetricKey,
          userId,
        );

        expect(mockBloodPressureModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockBloodPressure._id.toHexString(),
          expect.objectContaining({
            systolic: `enc(${updateDto.systolic})`,
            diastolic: `enc(${updateDto.diastolic})`,
            notes: `enc(${updateDto.notes})`,
            datetimeAt: `enc(${new Date(updateDto.datetimeAt!).toISOString()})`,
          }),
          { new: true },
        );

        expect(result).toEqual(
          expect.objectContaining({
            systolic: updatedSystolic,
            diastolic: updatedDiastolic,
            notes: updatedNote,
            datetimeAt: new Date(updatedDateTime),
          }),
        );
      });

      it('should throw NotFoundException if blood pressure log not found during update', async () => {
        mockBloodPressureModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => null });
        await expect(
          service.updateBloodPressure(
            'nonExistentId',
            { systolic: 100, diastolic: 70 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if blood pressure log not found after update', async () => {
        mockBloodPressureModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockBloodPressure });

        mockBloodPressureModel.findByIdAndUpdate = jest
          .fn()
          .mockReturnValue({ exec: () => null });

        await expect(
          service.updateBloodPressure(
            mockBloodPressure._id.toHexString(),
            { systolic: 100, diastolic: 70 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch during update blood pressure log', async () => {
        mockBloodPressureModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockBloodPressure });
        await expect(
          service.updateBloodPressure(
            mockWeight._id.toHexString(),
            { systolic: 100, diastolic: 70 },
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Blood Pressure logs - delete', () => {
      it('should remove a blood pressure log', async () => {
        await service.removeBloodPressure(
          mockBloodPressure._id.toHexString(),
          userId,
        );
        expect(mockBloodPressureModel.deleteOne).toHaveBeenCalledWith({
          _id: mockBloodPressure._id.toHexString(),
          userId,
        });
      });

      it('should throw NotFoundException if blood pressure log not found during remove', async () => {
        mockBloodPressureModel.deleteOne = jest.fn().mockReturnValue({
          exec: () => ({
            deletedCount: 0,
          }),
        });
        await expect(
          service.removeBloodPressure(
            mockBloodPressure._id.toHexString(),
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ===========================================================================
  // SLEEP TESTS
  // ===========================================================================
  describe('Sleep logs', () => {
    describe('Sleep logs - create', () => {
      it('should create and return a sleep log', async () => {
        const createDto: CreateSleepDto = {
          userId,
          rate: 6,
          notes: noteValue,
          startedAt: startedAtValue,
          datetimeAt: logDateTime,
        };
        const result = await service.createSleep(createDto, symmetricKey);

        expect(mockSleepModel).toHaveBeenCalledWith(
          expect.objectContaining({
            rate: `enc(${createDto.rate})`,
            notes: `enc(${createDto.notes})`,
            startedAt: `enc(${createDto.startedAt})`,
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.rate).toBe(6);
      });

      it('should create and return a sleep log without notes', async () => {
        const createDto: CreateSleepDto = {
          userId,
          rate: 5,
          startedAt: startedAtValue,
          datetimeAt: logDateTime,
        };
        const result = await service.createSleep(createDto, symmetricKey);

        expect(mockSleepModel).toHaveBeenCalledWith(
          expect.objectContaining({
            rate: `enc(${createDto.rate})`,
            notes: '',
            startedAt: `enc(${createDto.startedAt})`,
            datetimeAt: `enc(${createDto.datetimeAt})`,
          }),
        );
        expect(result.rate).toBe(5);
        expect(result.notes).toBeUndefined();
      });
    });

    describe('Sleep logs - find', () => {
      it('should return a single sleep log', async () => {
        const result = await service.findOneSleep(
          mockSleep._id.toHexString(),
          symmetricKey,
          userId,
        );
        expect(result.rate).toBe(sleepRateValue);
      });

      it('should throw NotFoundException if user missing sleep', async () => {
        await expect(
          service.findOneSleep('nonExistentId', symmetricKey, userId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch on findOne', async () => {
        await expect(
          service.findOneSleep(
            mockSleep._id.toHexString(),
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Sleep logs - findAll', () => {
      it('should return an array of sleep logs filtered by userId', async () => {
        const result = await service.findAllSleeps(symmetricKey, userId);
        expect(mockSleepModel.find).toHaveBeenCalledWith({ userId });
        expect(result).toHaveLength(1);
        expect(result[0].rate).toBe(sleepRateValue);
      });

      it('should return empty array for unknown user', async () => {
        const result = await service.findAllSleeps(symmetricKey, otherUserId);
        expect(mockSleepModel.find).toHaveBeenCalledWith({
          userId: otherUserId,
        });
        expect(result).toHaveLength(0);
      });
    });

    describe('Sleep logs - update', () => {
      it('should update and return the updated sleep log (all fields)', async () => {
        const updateDto: UpdateSleepDto = {
          rate: updatedSleepRate,
          notes: updatedNote,
          startedAt: updatedStartedAt,
          datetimeAt: updatedDateTime,
        };

        const result = await service.updateSleep(
          mockSleep._id.toHexString(),
          updateDto,
          symmetricKey,
          userId,
        );

        expect(mockSleepModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockSleep._id.toHexString(),
          expect.objectContaining({
            rate: `enc(${updateDto.rate})`,
            notes: `enc(${updateDto.notes})`,
            startedAt: `enc(${new Date(updateDto.startedAt!).toISOString()})`,
            datetimeAt: `enc(${new Date(updateDto.datetimeAt!).toISOString()})`,
          }),
          { new: true },
        );

        expect(result).toEqual(
          expect.objectContaining({
            rate: updatedSleepRate,
            notes: updatedNote,
            startedAt: new Date(updatedStartedAt),
            datetimeAt: new Date(updatedDateTime),
          }),
        );
      });

      it('should throw NotFoundException if sleep log not found during update', async () => {
        mockSleepModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => null });
        await expect(
          service.updateSleep(
            'nonExistentId',
            { rate: 10 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if sleep log not found after update', async () => {
        mockSleepModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockSleep });

        mockSleepModel.findByIdAndUpdate = jest
          .fn()
          .mockReturnValue({ exec: () => null });

        await expect(
          service.updateSleep(
            mockSleep._id.toHexString(),
            { rate: 10 },
            symmetricKey,
            userId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user mismatch during update sleep log', async () => {
        mockSleepModel.findById = jest
          .fn()
          .mockReturnValue({ exec: () => mockSleep });
        await expect(
          service.updateSleep(
            mockWeight._id.toHexString(),
            { rate: 10 },
            symmetricKey,
            otherUserId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Sleep logs - delete', () => {
      it('should remove a sleep log', async () => {
        await service.removeSleep(mockSleep._id.toHexString(), userId);
        expect(mockSleepModel.deleteOne).toHaveBeenCalledWith({
          _id: mockSleep._id.toHexString(),
          userId,
        });
      });

      it('should throw NotFoundException if sleep pressure log not found during remove', async () => {
        mockSleepModel.deleteOne = jest.fn().mockReturnValue({
          exec: () => ({
            deletedCount: 0,
          }),
        });
        await expect(
          service.removeSleep(mockSleep._id.toHexString(), userId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
