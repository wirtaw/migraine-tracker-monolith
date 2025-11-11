import { createHash } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IIncident } from './interfaces/incident.interface';
import { NotFoundException } from '@nestjs/common';
import { IncidentTypeEnum } from './enums/incident-type.enum';
import { TriggerTypeEnum } from '../triggers/enums/trigger-type.enum';
import { RequestWithUser } from 'src/auth/interfaces/auth.user.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { IncidentDocument, Incident } from './schemas/incident.schema';

const mockIIncident: IIncident = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  type: IncidentTypeEnum.MIGRAINE_ATTACK,
  startTime: new Date('2023-01-01T10:00:00Z'),
  durationHours: 2,
  notes: 'Started after stress',
  triggers: [TriggerTypeEnum.STRESS, TriggerTypeEnum.LACK_OF_SLEEP],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
};

const mockIIncidents: IIncident[] = [
  mockIIncident,
  {
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user456',
    type: IncidentTypeEnum.AURA_EPISODE,
    startTime: new Date('2023-01-02T10:00:00Z'),
    durationHours: 4,
    notes: 'Visual aura',
    triggers: [TriggerTypeEnum.WEATHER],
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
];

const mockIncidentsService = {
  create: jest.fn().mockResolvedValue(mockIIncident),
  findAll: jest.fn().mockResolvedValue(mockIIncidents),
  findOne: jest.fn().mockResolvedValue(mockIIncident),
  update: jest.fn().mockResolvedValue(mockIIncident),
  remove: jest.fn().mockResolvedValue(undefined),
};
const userId = 'user-123';

const encryptedIncident: Partial<IncidentDocument> = {
  id: 'incident001',
  userId,
  type: 'enc(MIGRAINE_ATTACK)',
  startTime: `enc(${mockIIncident.startTime.toISOString()})`,
  durationHours: `enc(${mockIIncident.durationHours})`,
  notes: `enc(${mockIIncident.notes})`,
  triggers: 'enc(["WEATHER"])',
  datetimeAt: 'enc(2025-09-23T10:00:00.000Z)',
  toObject: () => encryptedIncident,
};

const incidentModelMock = jest.fn().mockImplementation(() => encryptedIncident);

describe('IncidentsController', () => {
  let controller: IncidentsController;
  let service: IncidentsService;
  const symmetricKey = 'test-secret-key-long';
  const mockRequest: RequestWithUser = {
    session: {
      userId,
      key: symmetricKey,
    },
  } as RequestWithUser;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        {
          provide: IncidentsService,
          useValue: mockIncidentsService,
        },
        {
          provide: EncryptionService,
          useValue: {
            encryptSensitiveData: jest.fn((v: string) => `enc(${v})`),
            decryptSensitiveData: jest.fn((v: string) =>
              v.replace(/^enc\((.*)\)$/, '$1'),
            ),
          },
        },
        {
          provide: getModelToken(Incident.name),
          useValue: incidentModelMock,
        },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
    service = module.get<IncidentsService>(IncidentsService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an incident and return it', async () => {
      const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
      const incidentDateTime = '2023-01-01T12:00:00.000Z';
      const createDto: CreateIncidentDto = {
        userId: 'testUser',
        type: IncidentTypeEnum.MIGRAINE_ATTACK,
        startTime: incidentStartDateTime,
        durationHours: 1,
        notes: 'Test notes',
        triggers: [TriggerTypeEnum.WEATHER],
        datetimeAt: incidentDateTime,
      };
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(mockIIncident);

      const result = await controller.create(mockRequest, createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockIIncident);
    });

    it('should encrypt fields and return decrypted incident', async () => {
      const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
      const incidentDateTime = '2023-01-01T12:00:00.000Z';
      const createDto: CreateIncidentDto = {
        userId: 'testUser',
        type: IncidentTypeEnum.MIGRAINE_ATTACK,
        startTime: incidentStartDateTime,
        durationHours: mockIIncident.durationHours,
        notes: mockIIncident.notes,
        triggers: mockIIncident.triggers,
        datetimeAt: incidentDateTime,
      };
      const bufferKey = createHash('sha256').update(symmetricKey).digest();
      jest
        .spyOn(encryptionService, 'encryptSensitiveData')
        .mockImplementation((v) => `enc(${v})`);
      jest
        .spyOn(encryptionService, 'decryptSensitiveData')
        .mockImplementation((value, passedKey) => {
          expect(passedKey.equals(bufferKey)).toBe(true);
          return value.replace(/^enc\((.*)\)$/, '$1');
        });

      const result = await service.create(createDto, symmetricKey);

      expect(result.type).toBe(createDto.type);
      expect(result.notes).toBe(createDto.notes);
      expect(result.triggers).toEqual(createDto.triggers);
      expect(result.durationHours).toEqual(createDto.durationHours);
    });
  });

  describe('findAll', () => {
    it('should return an array of incidents', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll(mockRequest);

      expect(findAllSpy).toHaveBeenCalledWith(symmetricKey);
      expect(result).toEqual(mockIIncidents);
    });
  });

  describe('findOne', () => {
    it('should return a single incident', async () => {
      const id = mockIIncident.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id, mockRequest);

      expect(findOneSpy).toHaveBeenCalledWith(id, symmetricKey, userId);
      expect(result).toEqual(mockIIncident);
    });

    /*it('should find and decrypt incident by id', async () => {
      const key = 'secureKey123';
      const bufferKey = createHash('sha256').update(key).digest();

      jest
        .spyOn(incidentModelMock, 'findById')
        .mockResolvedValue(encryptedIncident);

      jest
        .spyOn(encryptionService, 'decryptSensitiveData')
        .mockImplementation((value, passedKey) => {
          expect(passedKey.equals(bufferKey)).toBe(true);
          return value.replace(/^enc\((.*)\)$/, '$1');
        });

      const result = await service.findOne('incident001', key);

      expect(result.id).toBe('incident001');
      expect(result.type).toBe(IncidentTypeEnum.MIGRAINE_ATTACK);
      expect(result.startTime.toISOString()).toBe('2025-09-23T10:00:00.000Z');
      expect(result.durationHours).toBe(2);
      expect(result.notes).toBe('Test notes');
      expect(result.triggers).toEqual([TriggerTypeEnum.WEATHER]);
    });*/

    it('should rethrow NotFoundException from service', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      const findOneSpy = jest.spyOn(service, 'findOne');

      await expect(controller.findOne(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith(id, symmetricKey, userId);
    });
  });

  describe('update', () => {
    it('should update and return the updated incident', async () => {
      const id = mockIIncident.id;
      const updateDto: UpdateIncidentDto = {
        notes: 'Updated notes',
        type: IncidentTypeEnum.MIGRAINE_ATTACK,
        startTime: '2025-10-21T00:00:00.000Z',
        durationHours: 1,
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto, mockRequest);

      expect(updateSpy).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockIIncident);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateIncidentDto = {
        notes: 'test',
        type: IncidentTypeEnum.MIGRAINE_ATTACK,
        startTime: '2025-10-21T00:00:00.000Z',
        durationHours: 1,
      };
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new NotFoundException());
      const updateSpy = jest.spyOn(service, 'update');

      await expect(
        controller.update(id, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(updateSpy).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
    });
  });

  describe('remove', () => {
    it('should remove an incident', async () => {
      const id = mockIIncident.id;
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await controller.remove(id);

      expect(removeSpy).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });

    it('should rethrow NotFoundException from service during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException());
      const removeSpy = jest.spyOn(service, 'remove');

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(removeSpy).toHaveBeenCalledWith(id);
    });
  });
});
