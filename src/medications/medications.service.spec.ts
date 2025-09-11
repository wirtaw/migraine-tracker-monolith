import { Test, TestingModule } from '@nestjs/testing';
import { MedicationsService } from './medications.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Medication,
  MedicationDocument,
  MedicationSchema,
} from './schemas/medication.schema';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { NotFoundException, Logger } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method */

const mockMedication: HydratedDocument<Medication> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  title: 'Paracetamol',
  dosage: '500mg',
  notes: 'Take with food',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
  updateAt: new Date('2023-01-01T10:00:00Z'),
} as never;

const mockMedications: HydratedDocument<Medication>[] = [
  mockMedication,
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    title: 'Ibuprofen',
    dosage: '200mg',
    notes: 'Take after meals',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
    updateAt: new Date('2023-01-02T10:00:00Z'),
  },
] as never;

describe('MedicationsService', () => {
  let service: MedicationsService;
  let mockMedicationModel: jest.Mocked<Model<MedicationDocument>>;
  let mockDocumentInstance: MedicationDocument;
  let module: TestingModule;
  let model: Model<MedicationDocument>;

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockMedication,
      save: jest.fn().mockResolvedValue(mockMedication),
    } as unknown as MedicationDocument;

    mockMedicationModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<MedicationDocument>>;

    mockMedicationModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMedications),
    });
    mockMedicationModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMedication),
    });
    mockMedicationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMedication),
    });
    mockMedicationModel.deleteOne = jest.fn().mockReturnValue({
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
          { name: Medication.name, schema: MedicationSchema },
        ]),
      ],
      providers: [
        MedicationsService,
        {
          provide: getModelToken(Medication.name),
          useValue: mockMedicationModel,
        },
      ],
    }).compile();

    service = module.get<MedicationsService>(MedicationsService);
    model = module.get<Model<MedicationDocument>>(
      getModelToken(Medication.name),
    );
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
    it('should create and return a medication', async () => {
      const createDto: CreateMedicationDto = {
        userId: 'testUser',
        title: 'Test Medication',
        dosage: '100mg',
        notes: 'Test note',
        datetimeAt: new Date(),
      };

      const result = await service.create(createDto);

      expect(mockMedicationModel).toHaveBeenCalledWith(createDto);
      expect(mockDocumentInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockMedication._id.toString(),
        userId: mockMedication.userId,
        title: mockMedication.title,
        dosage: mockMedication.dosage,
        notes: mockMedication.notes,
        createdAt: mockMedication.createdAt,
        datetimeAt: mockMedication.datetimeAt,
        updateAt: mockMedication.updateAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of medications', async () => {
      const result = await service.findAll();

      expect(mockMedicationModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockMedications.map((m) => ({
          id: m._id.toString(),
          userId: m.userId,
          title: m.title,
          dosage: m.dosage,
          notes: m.notes,
          createdAt: m.createdAt,
          datetimeAt: m.datetimeAt,
          updateAt: m.updateAt,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single medication', async () => {
      const result = await service.findOne(mockMedication._id.toHexString());

      expect(mockMedicationModel.findById).toHaveBeenCalledWith(
        mockMedication._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockMedication._id.toString(),
        userId: mockMedication.userId,
        title: mockMedication.title,
        dosage: mockMedication.dosage,
        notes: mockMedication.notes,
        createdAt: mockMedication.createdAt,
        datetimeAt: mockMedication.datetimeAt,
        updateAt: mockMedication.updateAt,
      });
    });

    it('should throw NotFoundException if medication not found', async () => {
      mockMedicationModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated medication', async () => {
      const updateDto: UpdateMedicationDto = {
        notes: 'Updated note',
      };
      const updatedMockMedication = {
        ...mockMedication,
        notes: 'Updated note',
      };
      mockMedicationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockMedication,
      });

      const result = await service.update(
        mockMedication._id.toHexString(),
        updateDto,
      );

      expect(mockMedicationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMedication._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockMedication._id.toString(),
        userId: updatedMockMedication.userId,
        title: updatedMockMedication.title,
        dosage: updatedMockMedication.dosage,
        notes: updatedMockMedication.notes,
        createdAt: updatedMockMedication.createdAt,
        datetimeAt: updatedMockMedication.datetimeAt,
        updateAt: updatedMockMedication.updateAt,
      });
    });

    it('should throw NotFoundException if medication not found during update', async () => {
      mockMedicationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update('nonExistentId', {
          notes: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a medication', async () => {
      mockMedicationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockMedication._id.toHexString());

      expect(mockMedicationModel.deleteOne).toHaveBeenCalledWith({
        _id: mockMedication._id.toHexString(),
      });
    });

    it('should throw NotFoundException if medication not found during remove', async () => {
      mockMedicationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMedicationModel.deleteOne).toHaveBeenCalledWith({
        _id: 'nonExistentId',
      });
    });
  });
});
