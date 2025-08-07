import { Test, TestingModule } from '@nestjs/testing';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { IMedication } from './interfaces/medication.interface';
import { NotFoundException } from '@nestjs/common';

const mockIMedication: IMedication = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  title: 'Paracetamol',
  dosage: '500mg',
  notes: 'Take with food',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
  updateAt: new Date('2023-01-01T10:00:00Z'),
};

const mockIMedications: IMedication[] = [
  mockIMedication,
  {
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user456',
    title: 'Ibuprofen',
    dosage: '200mg',
    notes: 'Take after meals',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
    updateAt: new Date('2023-01-02T10:00:00Z'),
  },
];

const mockMedicationsService = {
  create: jest.fn().mockResolvedValue(mockIMedication),
  findAll: jest.fn().mockResolvedValue(mockIMedications),
  findOne: jest.fn().mockResolvedValue(mockIMedication),
  update: jest.fn().mockResolvedValue(mockIMedication),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('MedicationsController', () => {
  let controller: MedicationsController;
  let service: MedicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicationsController],
      providers: [
        {
          provide: MedicationsService,
          useValue: mockMedicationsService,
        },
      ],
    }).compile();

    controller = module.get<MedicationsController>(MedicationsController);
    service = module.get<MedicationsService>(MedicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a medication and return it', async () => {
      const createDto: CreateMedicationDto = {
        userId: 'testUser',
        title: 'Test Medication',
        dosage: '100mg',
        notes: 'Test note',
        datetimeAt: new Date(),
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockIMedication);
    });
  });

  describe('findAll', () => {
    it('should return an array of medications', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockIMedications);
    });
  });

  describe('findOne', () => {
    it('should return a single medication', async () => {
      const id = mockIMedication.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockIMedication);
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
    it('should update and return the updated medication', async () => {
      const id = mockIMedication.id;
      const updateDto: UpdateMedicationDto = {
        notes: 'Updated note',
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockIMedication);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const id = 'nonExistentId';
      const updateDto: UpdateMedicationDto = {
        notes: 'test',
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
    it('should remove a medication', async () => {
      const id = mockIMedication.id;
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
