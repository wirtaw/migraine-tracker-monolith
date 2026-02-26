import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { TriggersService } from './triggers.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import { Trigger, TriggerDocument } from './schemas/trigger.schema';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { TriggerTypeEnum } from './enums/trigger-type.enum';

/* eslint-disable @typescript-eslint/unbound-method */

const typeValue = 'Headache';
const noteValue = 'Started after stress';
const triggerDateTime = '2023-01-01T12:00:00.000Z';

const mockTrigger: HydratedDocument<Trigger> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: `enc(${typeValue})`,
  note: `enc(${noteValue})`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${triggerDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockUpdatedTrigger: HydratedDocument<Trigger> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: `enc(${typeValue})`,
  note: `enc(Updated note)`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${triggerDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

type MockTrigger = Partial<Trigger> & { id?: string; _id?: Types.ObjectId };

const mockTriggers: MockTrigger[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    userId: 'user123',
    type: `enc(${typeValue})`,
    note: `enc(${noteValue})`,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    datetimeAt: `enc(${triggerDateTime})`,
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    type: `enc(Migraine)`,
    note: `enc(Visual aura)`,
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: `enc(2023-01-02T12:00:00.000Z)`,
  },
];

describe('TriggersService', () => {
  let service: TriggersService;
  let mockTriggerModel: jest.Mocked<Model<TriggerDocument>>;
  let encryptionService: EncryptionService;
  let module: TestingModule;
  let triggerTypeSet: Set<string>;

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
    triggerTypeSet = new Set<string>(Object.values(TriggerTypeEnum));
    const mockDocumentInstance = {
      ...mockTrigger,
      save: jest.fn().mockResolvedValue(mockTrigger),
    } as unknown as TriggerDocument;

    mockTriggerModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<TriggerDocument>>;

    mockTriggerModel.find = jest.fn().mockImplementation((query = {}) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = query['userId'] as string;
      const matched = userId
        ? mockTriggers.filter((t) => t.userId === userId)
        : mockTriggers;
      return {
        exec: jest.fn().mockResolvedValue(matched),
      };
    });

    mockTriggerModel.findById = jest.fn().mockImplementation((id: string) => {
      const found =
        mockTriggers.find((t) => t.id === id || t._id!.toHexString() === id) ||
        null;
      return { exec: jest.fn().mockResolvedValue(found) };
    });

    mockTriggerModel.create = jest.fn().mockResolvedValue(mockDocumentInstance);
    mockTriggerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedTrigger),
    });
    mockTriggerModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    module = await Test.createTestingModule({
      providers: [
        TriggersService,
        {
          provide: getModelToken('Trigger'),
          useValue: mockTriggerModel,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<TriggersService>(TriggersService);
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
    it('should create and return a trigger', async () => {
      const createDto: CreateTriggerDto = {
        userId: mockTriggers[0].userId!,
        type: typeValue,
        note: noteValue,
        datetimeAt: triggerDateTime,
      };

      const result = await service.create(createDto, symmetricKey);

      const mockConstructor = mockTriggerModel as unknown as jest.Mock;
      const calls = mockConstructor.mock.calls as unknown[][];
      const calledWithPayload = calls[0][0];

      expect(calledWithPayload).toEqual(
        expect.objectContaining({
          type: `enc(${createDto.type})`,
          note: `enc(${createDto.note})`,
          datetimeAt: `enc(${createDto.datetimeAt})`,
        }),
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.type,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.note,
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockTrigger._id.toString(),
          userId: createDto.userId,
          type: createDto.type,
          note: createDto.note,
          datetimeAt: new Date(createDto.datetimeAt),
        }),
      );
    });

    it('should create trigger without note', async () => {
      const createDto: CreateTriggerDto = {
        userId: mockTriggers[0].userId!,
        type: typeValue,
        note: '',
        datetimeAt: triggerDateTime,
      };

      const mockTriggerWithoutNote = {
        ...mockTrigger,
        note: '',
        save: jest.fn().mockResolvedValue({
          ...mockTrigger,
          note: '',
          toObject: () => ({ ...mockTrigger, note: '' }),
        }),
      } as unknown as TriggerDocument;

      (mockTriggerModel as unknown as jest.Mock).mockImplementation(
        () => mockTriggerWithoutNote,
      );

      const result = await service.create(createDto, symmetricKey);

      const mockConstructor = mockTriggerModel as unknown as jest.Mock;
      const calls = mockConstructor.mock.calls as unknown[][];
      const calledWithPayload = calls[0][0];

      expect(calledWithPayload).toEqual(
        expect.objectContaining({
          type: `enc(${createDto.type})`,
          note: '',
          datetimeAt: `enc(${createDto.datetimeAt})`,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockTrigger._id.toString(),
          userId: createDto.userId,
          type: createDto.type,
          note: undefined,
          datetimeAt: new Date(createDto.datetimeAt),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of decrypted triggers', async () => {
      const result = await service.findAll(
        symmetricKey,
        mockTriggers[0].userId!,
      );

      expect(mockTriggerModel.find).toHaveBeenCalledWith({
        userId: mockTriggers[0].userId!,
      });
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(typeValue);
      expect(result[0].note).toBe(noteValue);
      expect(result[0].datetimeAt).toEqual(new Date(triggerDateTime));
    });
  });

  describe('findOne', () => {
    it('should return a single decrypted trigger', async () => {
      const result = await service.findOne(
        mockTrigger._id.toHexString(),
        symmetricKey,
        mockTriggers[0].userId!,
      );

      expect(mockTriggerModel.findById).toHaveBeenCalledWith(
        mockTrigger._id.toHexString(),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockTrigger._id.toString(),
          userId: mockTriggers[0].userId!,
          type: typeValue,
          note: noteValue,
          datetimeAt: new Date(triggerDateTime),
        }),
      );
    });

    it('should throw NotFoundException if trigger not found', async () => {
      mockTriggerModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(
        service.findOne('nonExistentId', symmetricKey, mockTriggers[0].userId!),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId does not match', async () => {
      await expect(
        service.findOne(
          mockTrigger._id.toHexString(),
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw Error if decrypted value is not a string', async () => {
      const invalidTrigger = {
        ...mockTrigger,
        type: 123,
      };

      mockTriggerModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidTrigger),
      });

      await expect(
        service.findOne(
          mockTrigger._id.toHexString(),
          symmetricKey,
          mockTriggers[0].userId!,
        ),
      ).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update and return the updated trigger', async () => {
      const triggerDateTime = '2025-10-21T00:00:00.000Z';
      const updateDto: UpdateTriggerDto = {
        note: 'Updated note',
        userId: mockTriggers[0].userId!,
        type: 'TestType',
        datetimeAt: triggerDateTime,
      };
      const encryptedUpdate = {
        type: `enc(${updateDto.type})`,
        note: `enc(${updateDto.note})`,
        datetimeAt: `enc(${triggerDateTime})`,
      };

      const updatedMockTrigger = {
        ...mockTrigger,
        ...encryptedUpdate,
      };

      mockTriggerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMockTrigger),
      });

      const result = await service.update(
        mockTrigger._id.toHexString(),
        updateDto,
        symmetricKey,
        mockTriggers[0].userId!,
      );

      expect(mockTriggerModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTrigger._id.toHexString(),
        encryptedUpdate,
        { new: true },
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: updatedMockTrigger._id.toString(),
          userId: updatedMockTrigger.userId,
          type: updateDto.type,
          note: updateDto.note,
          datetimeAt: new Date(triggerDateTime),
        }),
      );
    });

    it('should throw NotFoundException if trigger not found during update', async () => {
      mockTriggerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });
      mockTriggerModel.findById = jest.fn().mockReturnValue({
        exec: () => mockTrigger,
      });

      await expect(
        service.update(
          mockTrigger._id.toHexString(),
          { note: 'test' },
          symmetricKey,
          mockTriggers[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId mismatch during update', async () => {
      await expect(
        service.update(
          mockTrigger._id.toHexString(),
          { note: 'test' },
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if trigger not found ', async () => {
      mockTriggerModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update(
          mockTrigger._id.toHexString(),
          { note: 'test' },
          symmetricKey,
          mockTriggers[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a trigger', async () => {
      mockTriggerModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(
        mockTrigger._id.toHexString(),
        mockTriggers[0].userId!,
      );

      expect(mockTriggerModel.deleteOne).toHaveBeenCalledWith({
        _id: mockTrigger._id.toHexString(),
        userId: mockTriggers[0].userId!,
      });
    });

    it('should throw NotFoundException if trigger not found during remove', async () => {
      mockTriggerModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(
        service.remove('nonExistentId', mockTriggers[0].userId!),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTriggerTypes', () => {
    it('should return a list of unique trigger types', async () => {
      const result = await service.getTriggerTypes(
        symmetricKey,
        mockTriggers[0].userId!,
      );

      expect(mockTriggerModel.find).toHaveBeenCalledWith({
        userId: mockTriggers[0].userId!,
      });

      const expectedTypes = new Set<string>([typeValue, ...triggerTypeSet]);

      expect(new Set(result)).toEqual(expectedTypes);
    });
  });
});
