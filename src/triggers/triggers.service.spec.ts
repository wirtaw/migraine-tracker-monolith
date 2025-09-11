// src/trigger/triggers.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TriggersService } from './triggers.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Trigger,
  TriggerDocument,
  TriggerSchema,
} from './schemas/trigger.schema';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { NotFoundException, Logger } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method */

const mockTrigger: HydratedDocument<Trigger> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: 'Headache',
  note: 'Started after stress',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
} as never;

const mockTriggers: HydratedDocument<Trigger>[] = [
  mockTrigger,
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    type: 'Migraine',
    note: 'Visual aura',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
] as never;

describe('TriggersService', () => {
  let service: TriggersService;
  let mockTriggerModel: jest.Mocked<Model<TriggerDocument>>;
  let mockDocumentInstance: TriggerDocument;
  let model: Model<TriggerDocument>;
  let module: TestingModule;

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockTrigger,
      save: jest.fn().mockResolvedValue(mockTrigger),
    } as unknown as TriggerDocument;

    mockTriggerModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<TriggerDocument>>;

    mockTriggerModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockTriggers),
    });
    mockTriggerModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockTrigger),
    });
    mockTriggerModel.create = jest.fn().mockResolvedValue(mockDocumentInstance);
    mockTriggerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentInstance),
    });
    mockTriggerModel.deleteOne = jest.fn().mockReturnValue({
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
          { name: Trigger.name, schema: TriggerSchema },
        ]),
      ],
      providers: [
        TriggersService,
        {
          provide: getModelToken('Trigger'),
          useValue: mockTriggerModel,
        },
      ],
    }).compile();

    service = module.get<TriggersService>(TriggersService);
    model = module.get<Model<TriggerDocument>>(getModelToken(Trigger.name));
  });

  afterEach(async () => {
    await model.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a trigger', async () => {
      const createDto: CreateTriggerDto = {
        userId: 'testUser',
        type: 'TestType',
        note: 'Test note',
        datetimeAt: new Date(),
      };

      const result = await service.create(createDto);

      expect(mockTriggerModel).toHaveBeenCalledWith(createDto);

      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockTrigger._id.toString(),
        userId: mockTrigger.userId,
        type: mockTrigger.type,
        note: mockTrigger.note,
        createdAt: mockTrigger.createdAt,
        datetimeAt: mockTrigger.datetimeAt,
      });
    });

    it('should create a trigger (simpler mock for Model.create)', async () => {
      const createDto: CreateTriggerDto = {
        userId: 'testUser',
        type: 'TestType',
        note: 'Test note',
        datetimeAt: new Date(),
      };

      const result = await service.create(createDto);

      expect(mockTriggerModel).toHaveBeenCalledWith(createDto);
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockTrigger._id.toString(),
        userId: mockTrigger.userId,
        type: mockTrigger.type,
        note: mockTrigger.note,
        createdAt: mockTrigger.createdAt,
        datetimeAt: mockTrigger.datetimeAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of triggers', async () => {
      const result = await service.findAll();

      expect(mockTriggerModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockTriggers.map((t) => ({
          id: t._id.toString(),
          userId: t.userId,
          type: t.type,
          note: t.note,
          createdAt: t.createdAt,
          datetimeAt: t.datetimeAt,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single trigger', async () => {
      const result = await service.findOne(mockTrigger._id.toHexString());

      expect(mockTriggerModel.findById).toHaveBeenCalledWith(
        mockTrigger._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockTrigger._id.toString(),
        userId: mockTrigger.userId,
        type: mockTrigger.type,
        note: mockTrigger.note,
        createdAt: mockTrigger.createdAt,
        datetimeAt: mockTrigger.datetimeAt,
      });
    });

    it('should throw NotFoundException if trigger not found', async () => {
      mockTriggerModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated trigger', async () => {
      const updateDto: UpdateTriggerDto = {
        note: 'Updated note',
        userId: mockTrigger.userId,
        type: mockTrigger.type,
      };
      const updatedMockTrigger = { ...mockTrigger, note: 'Updated note' };
      mockTriggerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockTrigger,
      });

      const result = await service.update(
        mockTrigger._id.toHexString(),
        updateDto,
      );

      expect(mockTriggerModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTrigger._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockTrigger._id.toString(),
        userId: updatedMockTrigger.userId,
        type: updatedMockTrigger.type,
        note: updatedMockTrigger.note,
        createdAt: updatedMockTrigger.createdAt,
        datetimeAt: updatedMockTrigger.datetimeAt,
      });
    });

    it('should throw NotFoundException if trigger not found during update', async () => {
      mockTriggerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update('nonExistentId', {
          note: 'test',
          userId: mockTrigger.userId,
          type: mockTrigger.type,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a trigger', async () => {
      mockTriggerModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockTrigger._id.toHexString());

      expect(mockTriggerModel.deleteOne).toHaveBeenCalledWith({
        _id: mockTrigger._id.toHexString(),
      });
    });

    it('should throw NotFoundException if trigger not found during remove', async () => {
      mockTriggerModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTriggerModel.deleteOne).toHaveBeenCalledWith({
        _id: 'nonExistentId',
      });
    });
  });
});
