import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { SymptomsService } from './symptoms.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import { Symptom, SymptomDocument } from './schemas/symptom.schema';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';

/* eslint-disable @typescript-eslint/unbound-method */

const typeValue = 'Headache';
const noteValue = 'Started after stress';
const symptomDateTime = '2023-01-01T12:00:00.000Z';
const severityValue = 5;

const mockSymptom: HydratedDocument<Symptom> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: `enc(${typeValue})`,
  severity: `enc(${severityValue})`,
  note: `enc(${noteValue})`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${symptomDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockUpdatedSymptom: HydratedDocument<Symptom> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: `enc(${typeValue})`,
  severity: `enc(8)`,
  note: `enc(Updated note)`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${symptomDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

type MockSymptom = Partial<Symptom> & { id?: string; _id?: Types.ObjectId };

const mockSymptoms: MockSymptom[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    userId: 'user123',
    type: `enc(${typeValue})`,
    severity: `enc(${severityValue})`,
    note: `enc(${noteValue})`,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    datetimeAt: `enc(${symptomDateTime})`,
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    type: `enc(Migraine)`,
    severity: `enc(8)`,
    note: `enc(Visual aura)`,
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: `enc(2023-01-02T12:00:00.000Z)`,
  },
];

describe('SymptomsService', () => {
  let service: SymptomsService;
  let mockSymptomModel: jest.Mocked<Model<SymptomDocument>>;
  let mockDocumentInstance: SymptomDocument;
  let encryptionService: EncryptionService;
  let module: TestingModule;

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
      ...mockSymptom,
      save: jest.fn().mockResolvedValue(mockSymptom),
    } as unknown as SymptomDocument;

    mockSymptomModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<SymptomDocument>>;

    mockSymptomModel.find = jest.fn().mockImplementation((query = {}) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = query['userId'] as string;
      const matched = userId
        ? mockSymptoms.filter((s) => s.userId === userId)
        : mockSymptoms;
      return {
        exec: jest.fn().mockResolvedValue(matched),
      };
    });

    mockSymptomModel.findById = jest.fn().mockImplementation((id: string) => {
      const found =
        mockSymptoms.find((s) => s.id === id || s._id!.toHexString() === id) ||
        null;
      return { exec: jest.fn().mockResolvedValue(found) };
    });

    mockSymptomModel.create = jest.fn().mockResolvedValue(mockDocumentInstance);
    mockSymptomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedSymptom),
    });
    mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    module = await Test.createTestingModule({
      providers: [
        SymptomsService,
        {
          provide: getModelToken('Symptom'),
          useValue: mockSymptomModel,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<SymptomsService>(SymptomsService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(encryptionService).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a symptom', async () => {
      const createDto: CreateSymptomDto = {
        userId: mockSymptoms[0].userId!,
        type: typeValue,
        severity: severityValue,
        note: noteValue,
        datetimeAt: symptomDateTime,
      };

      const result = await service.create(createDto, symmetricKey);

      const mockConstructor = mockSymptomModel as unknown as jest.Mock;
      const calls = mockConstructor.mock.calls as unknown[][];
      const calledWithPayload = calls[0][0];

      expect(calledWithPayload).toEqual(
        expect.objectContaining({
          type: `enc(${createDto.type})`,
          severity: `enc(${createDto.severity})`,
          note: `enc(${createDto.note})`,
          datetimeAt: `enc(${createDto.datetimeAt})`,
        }),
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.type,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.severity.toString(),
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockSymptom._id.toString(),
          userId: createDto.userId,
          type: createDto.type,
          severity: createDto.severity,
          note: createDto.note,
          datetimeAt: new Date(createDto.datetimeAt),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of decrypted symptoms for user', async () => {
      const result = await service.findAll(
        symmetricKey,
        mockSymptoms[0].userId!,
      );

      expect(mockSymptomModel.find).toHaveBeenCalledWith({
        userId: mockSymptoms[0].userId!,
      });
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(typeValue);
      expect(result[0].severity).toBe(severityValue);
      expect(result[0].note).toBe(noteValue);
      expect(result[0].datetimeAt).toEqual(new Date(symptomDateTime));
    });

    it('should return empty array if user has no symptoms', async () => {
      const result = await service.findAll(symmetricKey, 'unknownUser');
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single decrypted symptom', async () => {
      const result = await service.findOne(
        mockSymptom._id.toHexString(),
        symmetricKey,
        mockSymptoms[0].userId!,
      );

      expect(mockSymptomModel.findById).toHaveBeenCalledWith(
        mockSymptom._id.toHexString(),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockSymptom._id.toString(),
          userId: mockSymptoms[0].userId!,
          type: typeValue,
          severity: severityValue,
          note: noteValue,
          datetimeAt: new Date(symptomDateTime),
        }),
      );
    });

    it('should throw NotFoundException if symptom not found', async () => {
      mockSymptomModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(
        service.findOne('nonExistentId', symmetricKey, mockSymptoms[0].userId!),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId does not match', async () => {
      await expect(
        service.findOne(
          mockSymptom._id.toHexString(),
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw Error if decrypted value is not a string', async () => {
      const invalidSymptom = {
        ...mockSymptom,
        type: 123,
      };

      mockSymptomModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidSymptom),
      });

      await expect(
        service.findOne(
          mockSymptom._id.toHexString(),
          symmetricKey,
          mockSymptoms[0].userId!,
        ),
      ).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update and return the updated symptom', async () => {
      const symptomsDateTime = '2025-10-21T00:00:00.000Z';
      const symptomsType = 'Type';
      const symptomsSeverity = 8;
      const symptomsNote = 'Updated notes';
      const updateDto: UpdateSymptomDto = {
        note: symptomsNote,
        severity: symptomsSeverity,
        type: symptomsType,
        datetimeAt: symptomsDateTime,
      };

      const encryptedUpdate = {
        type: `enc(${updateDto.type})`,
        note: `enc(${updateDto.note})`,
        severity: `enc(${updateDto.severity})`,
        datetimeAt: `enc(${symptomsDateTime})`,
      };

      const updatedMockSymptom = {
        ...mockSymptom,
        ...encryptedUpdate,
      };

      mockSymptomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMockSymptom),
      });

      const result = await service.update(
        mockSymptom._id.toHexString(),
        updateDto,
        symmetricKey,
        mockSymptoms[0].userId!,
      );

      expect(mockSymptomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSymptom._id.toHexString(),
        encryptedUpdate,
        { new: true },
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: updatedMockSymptom._id.toString(),
          userId: updatedMockSymptom.userId,
          type: updateDto.type,
          note: updateDto.note,
          severity: updateDto.severity,
          datetimeAt: new Date(symptomsDateTime),
        }),
      );
    });

    it('should throw NotFoundException if symptom not found during update', async () => {
      mockSymptomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });
      mockSymptomModel.findById = jest.fn().mockReturnValue({
        exec: () => mockSymptom,
      });

      await expect(
        service.update(
          mockSymptom._id.toHexString(),
          { note: 'test' },
          symmetricKey,
          mockSymptoms[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if symptom not found ', async () => {
      mockSymptomModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update(
          mockSymptom._id.toHexString(),
          { note: 'test' },
          symmetricKey,
          mockSymptoms[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId mismatch during update', async () => {
      await expect(
        service.update(
          mockSymptom._id.toHexString(),
          { note: 'test' },
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a symptom', async () => {
      mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(
        mockSymptom._id.toHexString(),
        mockSymptoms[0].userId!,
      );

      expect(mockSymptomModel.deleteOne).toHaveBeenCalledWith({
        _id: mockSymptom._id.toHexString(),
        userId: mockSymptoms[0].userId!,
      });
    });

    it('should throw NotFoundException if symptom not found during remove', async () => {
      mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(
        service.remove('nonExistentId', mockSymptoms[0].userId!),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if remove with wrong userId (simulated by deletedCount 0)', async () => {
      mockSymptomModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });
      await expect(
        service.remove(mockSymptom._id.toHexString(), 'otherUser'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
