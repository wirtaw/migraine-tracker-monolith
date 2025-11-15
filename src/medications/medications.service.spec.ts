import crypto from 'node:crypto';
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
import { NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';

/* eslint-disable @typescript-eslint/unbound-method */

const noteValue = 'Take with food';
const titleValue = 'Paracetamol';
const dosageValue = '500mg';
const medicationDateTime = '2023-01-01T12:00:00.000Z';

const mockMedication: HydratedDocument<Medication> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  title: `enc(${titleValue})`,
  dosage: `enc(${dosageValue})`,
  notes: `enc(${noteValue})`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${medicationDateTime})`,
  updateAt: new Date('2023-01-01T10:00:00Z'),
  toObject: function () {
    return this;
  },
} as never;

const mockUpdatedMedication: HydratedDocument<Medication> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  title: `enc(${titleValue})`,
  dosage: `enc(${dosageValue})`,
  notes: `enc(Updated note)`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${medicationDateTime})`,
  updateAt: new Date('2023-01-01T10:00:00Z'),
  toObject: function () {
    return this;
  },
} as never;

type MockMedication = Partial<Medication> & {
  id?: string;
  _id?: Types.ObjectId;
};

const mockMedications: MockMedication[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    userId: 'user123',
    title: `enc(${titleValue})`,
    dosage: `enc(${dosageValue})`,
    notes: `enc(${noteValue})`,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    datetimeAt: `enc(${medicationDateTime})`,
    updateAt: new Date('2023-01-01T10:00:00Z'),
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user123',
    title: `enc(Ibuprofen)`,
    dosage: `enc(200mg)`,
    notes: `enc(Take after meals)`,
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: `enc(2023-01-02T12:00:00.000Z)`,
    updateAt: new Date('2023-01-02T10:00:00Z'),
  },
];

describe('MedicationsService', () => {
  let service: MedicationsService;
  let mockMedicationModel: jest.Mocked<Model<MedicationDocument>>;
  let mockDocumentInstance: MedicationDocument;
  let encryptionService: EncryptionService;
  let module: TestingModule;
  let model: Model<MedicationDocument>;

  const symmetricKey = crypto.randomBytes(32).toString('hex');
  const bufferKey = crypto.createHash('sha256').update(symmetricKey).digest();

  const mockEncryptionService = {
    encryptSensitiveData: jest.fn(
      (value: string, _key: string) => `enc(${value})`,
    ),
    decryptSensitiveData: jest.fn((value: string, _key: string) => {
      if (typeof value === 'string') {
        return value.replace(/^enc\((.*)\)$/, '$1');
      }
      throw new Error(
        `decryptSensitiveData: expected string, got ${typeof value}`,
      );
    }),
  };

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockMedication,
      save: jest.fn().mockResolvedValue(mockMedication),
    } as unknown as MedicationDocument;

    mockMedicationModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<MedicationDocument>>;

    mockMedicationModel.find = jest.fn().mockImplementation((query = {}) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = query['userId'] as string;
      const matched = userId
        ? mockMedications.filter((m) => m.userId === userId)
        : mockMedications;
      return {
        exec: jest.fn().mockResolvedValue(matched),
      };
    });

    mockMedicationModel.findById = jest
      .fn()
      .mockImplementation((id: string) => {
        const found =
          mockMedications.find(
            (m) => m.id === id || m._id!.toHexString() === id,
          ) || null;
        return { exec: jest.fn().mockResolvedValue(found) };
      });

    mockMedicationModel.create = jest
      .fn()
      .mockResolvedValue(mockDocumentInstance);
    mockMedicationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedMedication),
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
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<MedicationsService>(MedicationsService);
    model = module.get<Model<MedicationDocument>>(
      getModelToken(Medication.name),
    );
    encryptionService = module.get<EncryptionService>(EncryptionService);
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
        userId: 'user123',
        title: titleValue,
        dosage: dosageValue,
        notes: noteValue,
        datetimeAt: medicationDateTime,
      };

      const result = await service.create(createDto, symmetricKey);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const calledWithPayload = (mockMedicationModel as unknown as jest.Mock)
        .mock.calls[0][0];

      expect(calledWithPayload).toEqual(
        expect.objectContaining({
          title: `enc(${createDto.title})`,
          dosage: `enc(${createDto.dosage})`,
          notes: `enc(${createDto.notes})`,
          datetimeAt: `enc(${createDto.datetimeAt})`,
        }),
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.title,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.dosage,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.notes,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.datetimeAt,
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockMedication._id.toString(),
          userId: createDto.userId,
          title: createDto.title,
          dosage: createDto.dosage,
          notes: createDto.notes,
          datetimeAt: new Date(createDto.datetimeAt),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of decrypted medications', async () => {
      const result = await service.findAll(symmetricKey, 'user123');

      expect(mockMedicationModel.find).toHaveBeenCalledWith({
        userId: 'user123',
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe(titleValue);
      expect(result[0].notes).toBe(noteValue);
      expect(result[0].datetimeAt).toEqual(new Date(medicationDateTime));
    });
  });

  describe('findOne', () => {
    it('should return a single decrypted medication', async () => {
      const result = await service.findOne(
        mockMedication._id.toHexString(),
        symmetricKey,
        'user123',
      );

      expect(mockMedicationModel.findById).toHaveBeenCalledWith(
        mockMedication._id.toHexString(),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockMedication._id.toString(),
          userId: 'user123',
          title: titleValue,
          notes: noteValue,
          datetimeAt: new Date(medicationDateTime),
        }),
      );
    });

    it('should throw NotFoundException if medication not found', async () => {
      mockMedicationModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(
        service.findOne('nonExistentId', symmetricKey, 'user123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId does not match', async () => {
      await expect(
        service.findOne(
          mockMedication._id.toHexString(),
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update and return the updated medication', async () => {
      const updateDto: UpdateMedicationDto = {
        notes: 'Updated note',
      };

      const result = await service.update(
        mockMedication._id.toHexString(),
        updateDto,
        symmetricKey,
        'user123',
      );

      expect(mockMedicationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMedication._id.toHexString(),
        expect.objectContaining({ notes: `enc(${updateDto.notes})` }),
        { new: true },
      );
      expect(result.notes).toBe('Updated note');
    });

    it('should throw NotFoundException if medication not found during update', async () => {
      mockMedicationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });
      mockMedicationModel.findById = jest.fn().mockReturnValue({
        exec: () => mockMedication, // Found for initial check
      });

      await expect(
        service.update(
          mockMedication._id.toHexString(),
          { notes: 'test' },
          symmetricKey,
          'user123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId mismatch during update', async () => {
      await expect(
        service.update(
          mockMedication._id.toHexString(),
          { notes: 'test' },
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a medication', async () => {
      mockMedicationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockMedication._id.toHexString(), 'user123');

      expect(mockMedicationModel.deleteOne).toHaveBeenCalledWith({
        _id: mockMedication._id.toHexString(),
        userId: 'user123',
      });
    });

    it('should throw NotFoundException if medication not found during remove', async () => {
      mockMedicationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId', 'user123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
