import { Test, TestingModule } from '@nestjs/testing';
import { SymptomsService } from './symptoms.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Symptom,
  SymptomDocument,
  SymptomSchema,
} from './schemas/symptom.schema';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { NotFoundException, Logger } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

const mockSymptom: HydratedDocument<Symptom> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: 'Headache',
  severity: 5,
  note: 'Started after stress',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
} as any;

const mockSymptoms: HydratedDocument<Symptom>[] = [
  mockSymptom,
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    type: 'Migraine',
    severity: 8,
    note: 'Visual aura',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
] as any;

describe('SymptomsService', () => {
  let service: SymptomsService;
  let model: Model<SymptomDocument>;
  let mockSymptomModel: jest.Mocked<Model<SymptomDocument>>;
  let mockDocumentInstance: SymptomDocument;
  let module: TestingModule;

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockSymptom,
      save: jest.fn().mockResolvedValue(mockSymptom),
    } as unknown as SymptomDocument;

    mockSymptomModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<SymptomDocument>>;

    mockSymptomModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSymptoms),
    });
    mockSymptomModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSymptom),
    });
    mockSymptomModel.create = jest.fn().mockResolvedValue(mockDocumentInstance);
    mockSymptomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentInstance),
    });
    mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const dbUri =
      !process.env.MONGODB_PORT && process.env.MONGODB_CLUSTER
        ? `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_CLUSTER}`
        : `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DBNAME}?authSource=admin`;

    Logger.log(`Database URI ${dbUri}`);

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: dbUri,
          }),
        }),
        MongooseModule.forFeature([
          { name: Symptom.name, schema: SymptomSchema },
        ]),
      ],
      providers: [
        SymptomsService,
        {
          provide: getModelToken('Symptom'),
          useValue: mockSymptomModel,
        },
      ],
    }).compile();

    service = module.get<SymptomsService>(SymptomsService);
    model = module.get<Model<SymptomDocument>>(getModelToken(Symptom.name));
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
    it('should create and return a symptom', async () => {
      const createDto: CreateSymptomDto = {
        userId: 'testUser',
        type: 'TestType',
        severity: 3,
        note: 'Test notes',
        datetimeAt: new Date(),
      };

      const result = await service.create(createDto);

      expect(mockSymptomModel).toHaveBeenCalledWith(createDto);
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockSymptom._id.toString(),
        userId: mockSymptom.userId,
        type: mockSymptom.type,
        severity: mockSymptom.severity,
        note: mockSymptom.note,
        createdAt: mockSymptom.createdAt,
        datetimeAt: mockSymptom.datetimeAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of symptoms', async () => {
      const result = await service.findAll();

      expect(mockSymptomModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockSymptoms.map((t) => ({
          id: t._id.toString(),
          userId: t.userId,
          type: t.type,
          severity: t.severity,
          note: t.note,
          createdAt: t.createdAt,
          datetimeAt: t.datetimeAt,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single symptom', async () => {
      const result = await service.findOne(mockSymptom._id.toHexString());

      expect(mockSymptomModel.findById).toHaveBeenCalledWith(
        mockSymptom._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockSymptom._id.toString(),
        userId: mockSymptom.userId,
        type: mockSymptom.type,
        severity: mockSymptom.severity,
        note: mockSymptom.note,
        createdAt: mockSymptom.createdAt,
        datetimeAt: mockSymptom.datetimeAt,
      });
    });

    it('should throw NotFoundException if symptom not found', async () => {
      mockSymptomModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated symptom', async () => {
      const updateDto: UpdateSymptomDto = {
        note: 'Updated notes',
        userId: mockSymptom.userId,
        type: 'type2',
        severity: 10,
      };
      const updatedMockSymptom = { ...mockSymptom, note: 'Updated notes' };
      mockSymptomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockSymptom,
      });

      const result = await service.update(
        mockSymptom._id.toHexString(),
        updateDto,
      );

      expect(mockSymptomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSymptom._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockSymptom._id.toString(),
        userId: updatedMockSymptom.userId,
        type: updatedMockSymptom.type,
        severity: updatedMockSymptom.severity,
        note: updatedMockSymptom.note,
        createdAt: updatedMockSymptom.createdAt,
        datetimeAt: updatedMockSymptom.datetimeAt,
      });
    });

    it('should throw NotFoundException if symptom not found during update', async () => {
      mockSymptomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update('nonExistentId', {
          note: 'test',
          userId: mockSymptom.userId,
          type: 'type2',
          severity: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a symptom', async () => {
      mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockSymptom._id.toHexString());

      expect(mockSymptomModel.deleteOne).toHaveBeenCalledWith({
        _id: mockSymptom._id.toHexString(),
      });
    });

    it('should throw NotFoundException if symptom not found during remove', async () => {
      mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSymptomModel.deleteOne).toHaveBeenCalledWith({
        _id: 'nonExistentId',
      });
    });
  });
});
