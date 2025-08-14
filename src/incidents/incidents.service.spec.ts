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
import { NotFoundException, Logger } from '@nestjs/common';
import { IncidentTypeEnum } from './enums/incident-type.enum';
import { TriggerTypeEnum } from '../triggers/enums/trigger-type.enum';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

const mockIncident: HydratedDocument<Incident> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  type: IncidentTypeEnum.MIGRAINE_ATTACK,
  startTime: new Date('2023-01-01T10:00:00Z'),
  durationHours: 2,
  notes: 'Started after stress',
  triggers: [TriggerTypeEnum.STRESS, TriggerTypeEnum.LACK_OF_SLEEP],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
} as any;

const mockIncidents: HydratedDocument<Incident>[] = [
  mockIncident,
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    type: IncidentTypeEnum.AURA_EPISODE,
    startTime: new Date('2023-01-02T10:00:00Z'),
    durationHours: 4,
    notes: 'Visual aura',
    triggers: [TriggerTypeEnum.WEATHER],
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
] as any;

describe('IncidentsService', () => {
  let service: IncidentsService;
  let model: Model<IncidentDocument>;
  let mockIncidentModel: jest.Mocked<Model<IncidentDocument>>;
  let mockDocumentInstance: IncidentDocument;
  let module: TestingModule;

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockIncident,
      save: jest.fn().mockResolvedValue(mockIncident),
    } as unknown as IncidentDocument;

    mockIncidentModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<IncidentDocument>>;

    mockIncidentModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockIncidents),
    });
    mockIncidentModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockIncident),
    });
    mockIncidentModel.create = jest
      .fn()
      .mockResolvedValue(mockDocumentInstance);
    mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentInstance),
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
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    model = module.get<Model<IncidentDocument>>(getModelToken(Incident.name));
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
      const createDto: CreateIncidentDto = {
        userId: 'testUser',
        type: IncidentTypeEnum.AURA_EPISODE,
        startTime: new Date(),
        durationHours: 1,
        notes: 'Test notes',
        triggers: [TriggerTypeEnum.STRESS, TriggerTypeEnum.LACK_OF_SLEEP],
        datetimeAt: new Date(),
      };

      const result = await service.create(createDto);

      expect(mockIncidentModel).toHaveBeenCalledWith(createDto);
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockIncident._id.toString(),
        userId: mockIncident.userId,
        type: mockIncident.type,
        startTime: mockIncident.startTime,
        durationHours: mockIncident.durationHours,
        notes: mockIncident.notes,
        triggers: mockIncident.triggers,
        createdAt: mockIncident.createdAt,
        datetimeAt: mockIncident.datetimeAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of incidents', async () => {
      const result = await service.findAll();

      expect(mockIncidentModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockIncidents.map((t) => ({
          id: t._id.toString(),
          userId: t.userId,
          type: t.type,
          startTime: t.startTime,
          durationHours: t.durationHours,
          notes: t.notes,
          triggers: t.triggers,
          createdAt: t.createdAt,
          datetimeAt: t.datetimeAt,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single incident', async () => {
      const result = await service.findOne(mockIncident._id.toHexString());

      expect(mockIncidentModel.findById).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockIncident._id.toString(),
        userId: mockIncident.userId,
        type: mockIncident.type,
        startTime: mockIncident.startTime,
        durationHours: mockIncident.durationHours,
        notes: mockIncident.notes,
        triggers: mockIncident.triggers,
        createdAt: mockIncident.createdAt,
        datetimeAt: mockIncident.datetimeAt,
      });
    });

    it('should throw NotFoundException if incident not found', async () => {
      mockIncidentModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated incident', async () => {
      const updateDto: UpdateIncidentDto = {
        notes: 'Updated notes',
        type: IncidentTypeEnum.AURA_EPISODE,
        startTime: new Date('2025-10-21'),
        durationHours: 1,
      };
      const updatedMockIncident = { ...mockIncident, notes: 'Updated notes' };
      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockIncident,
      });

      const result = await service.update(
        mockIncident._id.toHexString(),
        updateDto,
      );

      expect(mockIncidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockIncident._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockIncident._id.toString(),
        userId: updatedMockIncident.userId,
        type: updatedMockIncident.type,
        startTime: updatedMockIncident.startTime,
        durationHours: updatedMockIncident.durationHours,
        notes: updatedMockIncident.notes,
        triggers: updatedMockIncident.triggers,
        createdAt: updatedMockIncident.createdAt,
        datetimeAt: updatedMockIncident.datetimeAt,
      });
    });

    it('should throw NotFoundException if incident not found during update', async () => {
      mockIncidentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update('nonExistentId', {
          notes: 'test',
          type: IncidentTypeEnum.AURA_EPISODE,
          startTime: new Date('2025-10-21'),
          durationHours: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an incident', async () => {
      mockIncidentModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockIncident._id.toHexString());

      expect(mockIncidentModel.deleteOne).toHaveBeenCalledWith({
        _id: mockIncident._id.toHexString(),
      });
    });

    it('should throw NotFoundException if incident not found during remove', async () => {
      mockIncidentModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockIncidentModel.deleteOne).toHaveBeenCalledWith({
        _id: 'nonExistentId',
      });
    });
  });
});
