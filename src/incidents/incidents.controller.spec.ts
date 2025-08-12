import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IIncident } from './interfaces/incident.interface';
import { NotFoundException } from '@nestjs/common';

const mockIIncident: IIncident = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  type: 'Headache',
  startTime: new Date('2023-01-01T10:00:00Z'),
  durationHours: 2,
  notes: 'Started after stress',
  triggers: ['stress', 'bright lights'],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
};

const mockIIncidents: IIncident[] = [
  mockIIncident,
  {
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user456',
    type: 'Migraine',
    startTime: new Date('2023-01-02T10:00:00Z'),
    durationHours: 4,
    notes: 'Visual aura',
    triggers: ['caffeine'],
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

describe('IncidentsController', () => {
  let controller: IncidentsController;
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        {
          provide: IncidentsService,
          useValue: mockIncidentsService,
        },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
    service = module.get<IncidentsService>(IncidentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an incident and return it', async () => {
      const createDto: CreateIncidentDto = {
        userId: 'testUser',
        type: 'TestType',
        startTime: new Date(),
        durationHours: 1,
        notes: 'Test notes',
        triggers: ['trigger1'],
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIIncident);
    });
  });

  describe('findAll', () => {
    it('should return an array of incidents', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockIIncidents);
    });
  });

  describe('findOne', () => {
    it('should return a single incident', async () => {
      const id = mockIIncident.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockIIncident);
    });

    it('should rethrow NotFoundException from service', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      const findOneSpy = jest.spyOn(service, 'findOne');

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(findOneSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update and return the updated incident', async () => {
      const id = mockIIncident.id;
      const updateDto: UpdateIncidentDto = {
        notes: 'Updated notes',
        type: 'test',
        startTime: new Date('2025-10-21'),
        durationHours: 1,
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockIIncident);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateIncidentDto = {
        notes: 'test',
        type: 'test',
        startTime: new Date('2025-10-21'),
        durationHours: 1,
      };
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new NotFoundException());
      const updateSpy = jest.spyOn(service, 'update');

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
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
