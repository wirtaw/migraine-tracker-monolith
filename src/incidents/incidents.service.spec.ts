import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from './incidents.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Incident,
  IncidentDocument,
  IncidentSchema,
} from './schemas/incident.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import {
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { IncidentTypeEnum } from './enums/incident-type.enum';
import { TriggerTypeEnum } from '../triggers/enums/trigger-type.enum';
import { EncryptionService } from '../auth/encryption/encryption.service';

/* eslint-disable @typescript-eslint/unbound-method */

const incidentDateTime = '2023-01-01T12:00:00.000Z';
const incidentNextDateTime = '2023-01-01T12:00:00.000Z';
const triggersCreate: TriggerTypeEnum[] = [
  TriggerTypeEnum.STRESS,
  TriggerTypeEnum.LACK_OF_SLEEP,
];
const noteValue = 'Started after stress';

const mockIncident: HydratedDocument<Incident> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: `enc(MIGRAINE_ATTACK)`,
  startTime: 'enc(2023-01-01T10:00:00Z)',
  durationHours: 'enc(2)',
  notes: `enc(${noteValue})`,
  triggers: `enc(${JSON.stringify(triggersCreate)})`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${incidentDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockUpdatedIncident: HydratedDocument<Incident> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: `enc(AURA_EPISODE)`,
  startTime: 'enc(2025-10-21T00:00:00.000Z)',
  durationHours: 'enc(1)',
  notes: `enc(${noteValue})`,
  triggers: `enc(${JSON.stringify(triggersCreate)})`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${incidentDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockWInvalidTypeIncident: HydratedDocument<Incident> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d33'),
  userId: 'user123',
  type: `enc(FAILED)`,
  startTime: 'enc(2025-10-21T00:00:00.000Z)',
  durationHours: 'enc(1)',
  notes: `enc(${noteValue})`,
  triggers: `enc(${JSON.stringify(triggersCreate)})`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${incidentDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockWInvalidTriggerIncident: HydratedDocument<Incident> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d34'),
  userId: 'user123',
  type: `enc(AURA_EPISODE)`,
  startTime: 'enc(2025-10-21T00:00:00.000Z)',
  durationHours: 'enc(1)',
  notes: `enc(${noteValue})`,
  triggers: `enc(25, 47, "")`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${incidentDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockWInvalidBrokenIncident: HydratedDocument<Incident> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d34'),
  userId: 'user123',
  type: `enc(AURA_EPISODE)`,
  startTime: 'enc(2025-10-21T00:00:00.000Z)',
  durationHours: 'enc(1)',
  notes: `enc(${noteValue})`,
  triggers: `enc(["Failed"])`,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${incidentDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

type QueryValue = string | number | boolean | null | QueryObject;
type QueryObject = { $in?: Array<string | number> } | Record<string, unknown>;
type Query = Record<string, QueryValue> | undefined;
type MockIncident = Partial<Incident> & { id?: string; _id?: Types.ObjectId };

const mockIncidents: MockIncident[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    id: '60c72b2f9b1d8e001c8e4d3a',
    userId: 'user123',
    type: `enc(MIGRAINE_ATTACK)`,
    startTime: `enc(2023-01-01T10:00:00Z)`,
    durationHours: `enc(2)`,
    notes: `enc(${noteValue})`,
    triggers: `enc(${JSON.stringify(triggersCreate)})`,
    createdAt: new Date('2023-01-01T10:00:00.000Z'),
    datetimeAt: `enc(${incidentDateTime})`,
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user123',
    type: `enc(AURA_EPISODE)`,
    startTime: `enc(2023-01-02T10:00:00.000Z)`,
    durationHours: `enc(4)`,
    notes: `enc(Visual aura)`,
    triggers: `enc(["${TriggerTypeEnum.WEATHER}"])`,
    createdAt: new Date('2023-01-02T10:00:00.000Z'),
    datetimeAt: `enc(${incidentNextDateTime})`,
  },
];

function isQueryObject(value: unknown): value is QueryObject {
  return typeof value === 'object' && value !== null;
}

function isInOperator(
  obj: QueryObject,
): obj is { $in: Array<string | number> } {
  return '$in' in obj && Array.isArray((obj as any).$in);
}

function matchesQuery<T extends Record<string, unknown>>(
  doc: T,
  query?: Query,
): boolean {
  if (!query || Object.keys(query).length === 0) return true;

  return Object.entries(query).every(([key, rawValue]) => {
    const docValue = doc[key as keyof T];

    if (
      rawValue === null ||
      typeof rawValue === 'string' ||
      typeof rawValue === 'number' ||
      typeof rawValue === 'boolean'
    ) {
      return docValue === rawValue;
    }

    if (isQueryObject(rawValue)) {
      if (isInOperator(rawValue)) {
        const inArray = rawValue.$in;
        if (typeof docValue === 'string' || typeof docValue === 'number') {
          return inArray.includes(docValue);
        }
        return false;
      }

      if (typeof docValue === 'object' && docValue !== null) {
        return matchesQuery(
          docValue as Record<string, unknown>,
          rawValue as Record<string, QueryValue>,
        );
      }

      return false;
    }

    return false;
  });
}

describe('IncidentsService', () => {
  let service: IncidentsService;
  let model: Model<IncidentDocument>;
  let mockIncidentModel: jest.Mocked<Model<IncidentDocument>>;
  let mockDocumentInstance: IncidentDocument;
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
      ...mockIncident,
      save: jest.fn().mockResolvedValue(mockIncident),
    } as unknown as IncidentDocument;

    mockIncidentModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<IncidentDocument>>;

    mockIncidentModel.find = jest.fn().mockImplementation((query = {}) => {
      const matched = mockIncidents.filter((inc) =>
        matchesQuery<MockIncident>(inc, query),
      );

      return {
        exec: jest.fn().mockResolvedValue(matched),
        limit: jest.fn().mockImplementation((n: number) => ({
          exec: jest.fn().mockResolvedValue(matched.slice(0, n)),
        })),
        sort: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockResolvedValue(matched),
        })),
      };
    });
    mockIncidentModel.findById = jest.fn().mockImplementation((id: string) => {
      const found =
        mockIncidents.find(
          (inc) => inc.id === id || inc._id!.toHexString() === id,
        ) || null;
      return { exec: jest.fn().mockResolvedValue(found) };
    });
    mockIncidentModel.create = jest
      .fn()
      .mockResolvedValue(mockDocumentInstance);
    mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedIncident),
    });
    mockIncidentModel.deleteOne = jest.fn().mockReturnValue({
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
          { name: Incident.name, schema: IncidentSchema },
        ]),
      ],
      providers: [
        IncidentsService,
        {
          provide: getModelToken('Incident'),
          useValue: mockIncidentModel,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    model = module.get<Model<IncidentDocument>>(getModelToken(Incident.name));
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
    it('should create and return an incident', async () => {
      const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
      const durationHours = 2;
      const createDto: CreateIncidentDto = {
        userId: 'user123',
        type: IncidentTypeEnum.MIGRAINE_ATTACK,
        startTime: incidentStartDateTime,
        durationHours: durationHours,
        notes: noteValue,
        triggers: triggersCreate,
        datetimeAt: incidentDateTime,
      };

      const result = await service.create(createDto, symmetricKey);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const calledWithPayload = (mockIncidentModel as unknown as jest.Mock).mock
        .calls[0][0];

      expect(calledWithPayload).toEqual(
        expect.objectContaining({
          type: `enc(${IncidentTypeEnum.MIGRAINE_ATTACK})`,
          startTime: `enc(${incidentStartDateTime})`,
          durationHours: `enc(${durationHours})`,
          notes: `enc(${noteValue})`,
          triggers: `enc(${JSON.stringify(triggersCreate)})`,
          userId: `${createDto?.userId}`,
          datetimeAt: `enc(${incidentDateTime})`,
        }),
      );
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.type.toString(),
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.startTime,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.durationHours.toString(),
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.notes,
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        JSON.stringify(createDto.triggers),
        bufferKey,
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.datetimeAt,
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockIncident._id.toString(),
          userId: createDto.userId,
          type: createDto.type,
          startTime: new Date(createDto.startTime),
          durationHours: createDto.durationHours,
          notes: createDto.notes,
          triggers: createDto.triggers,
          datetimeAt: new Date(createDto.datetimeAt),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of incidents', async () => {
      const result = await service.findAll(
        symmetricKey,
        mockIncidents[0].userId!,
      );

      expect(mockIncidentModel.find).toHaveBeenCalledWith({
        userId: 'user123',
      });

      expect(result).toEqual([
        {
          id: mockIncidents[0]._id!.toString(),
          userId: mockIncidents[0].userId,
          type: IncidentTypeEnum.MIGRAINE_ATTACK,
          startTime: new Date('2023-01-01T10:00:00Z'),
          durationHours: 2,
          notes: noteValue,
          triggers: triggersCreate,
          createdAt: mockIncidents[0].createdAt,
          datetimeAt: new Date(incidentDateTime),
        },
        {
          id: mockIncidents[1]._id!.toString(),
          userId: mockIncidents[1].userId,
          type: IncidentTypeEnum.AURA_EPISODE,
          startTime: new Date('2023-01-02T10:00:00.000Z'),
          durationHours: 4,
          notes: 'Visual aura',
          triggers: [TriggerTypeEnum.WEATHER],
          createdAt: mockIncidents[1].createdAt,
          datetimeAt: new Date(incidentNextDateTime),
        },
      ]);
    });

    it('should return empty array of incidents for unknown userId', async () => {
      const userId = 'unknown-user-id';
      const result = await service.findAll(symmetricKey, userId);

      expect(mockIncidentModel.find).toHaveBeenCalledWith({ userId });

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single incident', async () => {
      const result = await service.findOne(
        mockIncident._id.toHexString(),
        symmetricKey,
        mockIncidents[0].userId!,
      );

      expect(mockIncidentModel.findById).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockIncidents[0]._id!.toString(),
        userId: mockIncidents[0].userId,
        type: IncidentTypeEnum.MIGRAINE_ATTACK,
        startTime: new Date('2023-01-01T10:00:00Z'),
        durationHours: 2,
        notes: noteValue,
        triggers: triggersCreate,
        createdAt: mockIncidents[0].createdAt,
        datetimeAt: new Date(incidentDateTime),
      });
    });

    it('should throw Error if incident has invalid type', async () => {
      mockIncidentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWInvalidTypeIncident),
      });

      await expect(
        service.findOne(
          mockWInvalidTypeIncident._id.toHexString(),
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(Error);
    });

    it('should throw Error if incident has invalid trigger', async () => {
      mockIncidentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWInvalidTriggerIncident),
      });

      await expect(
        service.findOne(
          mockWInvalidTriggerIncident._id.toHexString(),
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(Error);
    });

    it('should throw Error if incident has wrong key trigger', async () => {
      mockIncidentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWInvalidBrokenIncident),
      });

      await expect(
        service.findOne(
          mockWInvalidBrokenIncident._id.toHexString(),
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(Error);
    });

    it('should throw NotFoundException if incident not found', async () => {
      await expect(
        service.findOne(
          'nonExistentId',
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mockIncidentModel.findById).toHaveBeenCalledWith('nonExistentId');
    });

    it('should throw ForbiddenException if user has no access', async () => {
      await expect(
        service.findOne(mockIncident._id.toHexString(), symmetricKey, 'test'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockIncidentModel.findById).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
      );
    });

    it('should throw Error if decrypted value is not a string', async () => {
      const invalidIncident = {
        ...mockIncident,
        type: 123,
      };

      mockIncidentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidIncident),
      });

      await expect(
        service.findOne(
          mockIncident._id.toHexString(),
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update and return the updated incident with minimal not changed', async () => {
      const incidentStartDateTime = '2025-10-10T00:00:00.000Z';
      const updateDto: UpdateIncidentDto = {
        notes: 'Updated notes',
        type: IncidentTypeEnum.AURA_EPISODE,
        startTime: incidentStartDateTime,
        durationHours: 1,
      };
      const encryptedUpdate = {
        type: `enc(${updateDto.type})`,
        startTime: `enc(${incidentStartDateTime})`,
        durationHours: `enc(${updateDto.durationHours})`,
        notes: `enc(${updateDto.notes})`,
      };

      const updatedMockIncident = {
        ...mockIncident,
        ...encryptedUpdate,
      };

      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMockIncident),
      });

      const result = await service.update(
        mockIncident._id.toHexString(),
        updateDto,
        symmetricKey,
        mockIncidents[0].userId!,
      );

      expect(mockIncidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
        encryptedUpdate,
        { new: true },
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto.type,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.startTime,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.durationHours?.toString(),
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto.notes,
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: updatedMockIncident._id.toString(),
          userId: updatedMockIncident.userId,
          type: updateDto.type,
          startTime: new Date(incidentStartDateTime),
          durationHours: updateDto.durationHours,
          notes: updateDto.notes,
          triggers: triggersCreate,
          createdAt: mockIncident.createdAt,
          datetimeAt: new Date(incidentDateTime),
        }),
      );
    });

    it('should update and return the updated incident with minimal not changed notes', async () => {
      const incidentStartDateTime = '2025-10-10T00:00:00.000Z';
      const updateDto: UpdateIncidentDto = {
        type: IncidentTypeEnum.AURA_EPISODE,
        startTime: incidentStartDateTime,
        durationHours: 1,
      };
      const encryptedUpdate = {
        type: `enc(${updateDto.type})`,
        startTime: `enc(${incidentStartDateTime})`,
        durationHours: `enc(${updateDto.durationHours})`,
      };

      const updatedMockIncident = {
        ...mockIncident,
        ...encryptedUpdate,
      };

      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMockIncident),
      });

      const result = await service.update(
        mockIncident._id.toHexString(),
        updateDto,
        symmetricKey,
        mockIncidents[0].userId!,
      );

      expect(mockIncidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
        encryptedUpdate,
        { new: true },
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto.type,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.startTime,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.durationHours?.toString(),
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: updatedMockIncident._id.toString(),
          userId: updatedMockIncident.userId,
          type: updateDto.type,
          startTime: new Date(incidentStartDateTime),
          durationHours: updateDto.durationHours,
          notes: noteValue,
          triggers: triggersCreate,
          createdAt: mockIncident.createdAt,
          datetimeAt: new Date(incidentDateTime),
        }),
      );
    });

    it('should update and return the updated incident full updated', async () => {
      const incidentStartDateTime = '2025-10-11T00:00:00.000Z';
      const incidentDateTime = '2025-10-21T00:00:00.000Z';
      const updateDto: UpdateIncidentDto = {
        notes: 'Updated notes',
        type: IncidentTypeEnum.AURA_EPISODE,
        startTime: incidentStartDateTime,
        durationHours: 2,
        triggers: [TriggerTypeEnum.EXERCISE, TriggerTypeEnum.LACK_OF_SLEEP],
        datetimeAt: incidentDateTime,
      };
      const encryptedUpdate = {
        type: `enc(${updateDto.type})`,
        startTime: `enc(${incidentStartDateTime})`,
        durationHours: `enc(${updateDto.durationHours})`,
        notes: `enc(${updateDto.notes})`,
        triggers: 'enc(["Exercise","Lack of Sleep"])',
        datetimeAt: `enc(${incidentDateTime})`,
      };

      const updatedMockIncident = {
        ...mockIncident,
        ...encryptedUpdate,
      };

      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMockIncident),
      });

      const result = await service.update(
        mockIncident._id.toHexString(),
        updateDto,
        symmetricKey,
        mockIncidents[0].userId!,
      );

      expect(mockIncidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
        encryptedUpdate,
        { new: true },
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto.type,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.startTime,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.durationHours?.toString(),
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto.notes,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        updateDto?.datetimeAt,
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        JSON.stringify(updateDto.triggers),
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: updatedMockIncident._id.toString(),
          userId: updatedMockIncident.userId,
          type: updateDto.type,
          startTime: new Date(incidentStartDateTime),
          durationHours: updateDto.durationHours,
          notes: updateDto.notes,
          triggers: updateDto.triggers,
          createdAt: mockIncident.createdAt,
          datetimeAt: new Date(incidentDateTime),
        }),
      );
    });

    it('should throw BadRequestException if datetimeAt is after startTime', async () => {
      const incidentStartDateTime = '2025-10-21T00:00:00.000Z';
      const incidentDateTime = '2025-10-11T00:00:00.000Z';
      const updateDto: UpdateIncidentDto = {
        notes: 'Updated notes',
        type: IncidentTypeEnum.AURA_EPISODE,
        startTime: incidentStartDateTime,
        durationHours: 2,
        triggers: [TriggerTypeEnum.EXERCISE, TriggerTypeEnum.LACK_OF_SLEEP],
        datetimeAt: incidentDateTime,
      };

      await expect(
        service.update(
          mockIncident._id.toHexString(),
          updateDto,
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if incident not found during update', async () => {
      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update(
          'nonExistentId',
          {
            notes: 'test',
            type: IncidentTypeEnum.AURA_EPISODE,
            startTime: '2025-10-21T00:00:00.000Z',
            durationHours: 1,
          },
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if incident userId and session are differ', async () => {
      await expect(
        service.update(
          mockIncident._id.toHexString(),
          {
            notes: 'test',
            type: IncidentTypeEnum.AURA_EPISODE,
            startTime: '2025-10-21T00:00:00.000Z',
            durationHours: 1,
          },
          symmetricKey,
          'some-wrong-UserId',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if incident failed to update', async () => {
      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(
        service.update(
          mockIncident._id.toHexString(),
          {
            notes: 'test',
            type: IncidentTypeEnum.AURA_EPISODE,
            startTime: '2025-10-21T00:00:00.000Z',
            durationHours: 1,
          },
          symmetricKey,
          mockIncidents[0].userId!,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an incident', async () => {
      mockIncidentModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(
        mockIncident._id.toHexString(),
        mockIncidents[0].userId!,
      );

      expect(mockIncidentModel.deleteOne).toHaveBeenCalledWith({
        _id: mockIncident._id.toHexString(),
        userId: mockIncidents[0].userId,
      });
    });

    it('should throw NotFoundException if incident not found during remove', async () => {
      mockIncidentModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(
        service.remove('nonExistentId', mockIncidents[0].userId!),
      ).rejects.toThrow(NotFoundException);
      expect(mockIncidentModel.deleteOne).toHaveBeenCalledWith({
        _id: 'nonExistentId',
        userId: mockIncidents[0].userId,
      });
    });

    it('should throw NotFoundException if incident not found during remove with wrong userID', async () => {
      mockIncidentModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(
        service.remove(mockIncident._id.toHexString(), 'nonExistentUserId'),
      ).rejects.toThrow(NotFoundException);
      expect(mockIncidentModel.deleteOne).toHaveBeenCalledWith({
        _id: mockIncident._id.toHexString(),
        userId: 'nonExistentUserId',
      });
    });
  });
});
