import { Test, TestingModule } from '@nestjs/testing';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { IMedication } from './interfaces/medication.interface';
import { NotFoundException } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';
import { MedicationsTitleEnum } from './enums/medications-title.enums';

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
  getMedicationTitles: jest
    .fn()
    .mockResolvedValue(
      Array.from(new Set(Object.values(MedicationsTitleEnum))),
    ),
};

const symmetricKey = 'test-secret-key-long';
const userId = 'user123';

describe('MedicationsController', () => {
  let controller: MedicationsController;
  let service: MedicationsService;
  let mockRequest: RequestWithUser;
  let module: TestingModule;
  let titleSet: Set<string>;

  beforeEach(async () => {
    titleSet = new Set<string>(Object.values(MedicationsTitleEnum));
    module = await Test.createTestingModule({
      controllers: [MedicationsController],
      providers: [
        {
          provide: MedicationsService,
          useValue: mockMedicationsService,
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
      ],
    }).compile();

    controller = module.get<MedicationsController>(MedicationsController);
    service = module.get<MedicationsService>(MedicationsService);

    mockRequest = {
      session: {
        userId,
        key: symmetricKey,
      },
      user: {
        id: userId,
      },
    } as unknown as RequestWithUser;
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
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
        datetimeAt: new Date().toISOString(),
      };
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto, mockRequest);

      expect(createSpy).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockIMedication);
    });

    it('should encrypt fields in service call', async () => {
      const createDto: CreateMedicationDto = {
        userId: 'testUser',
        title: 'Test Medication',
        dosage: '100mg',
        notes: 'Test note',
        datetimeAt: new Date().toISOString(),
      };
      await controller.create(createDto, mockRequest);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(createDto, symmetricKey);
    });
  });

  describe('findAll', () => {
    it('should return an array of medications', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll(mockRequest);

      expect(findAllSpy).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual(mockIMedications);
    });
  });

  describe('findOne', () => {
    it('should return a single medication', async () => {
      const id = mockIMedication.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id, mockRequest);

      expect(findOneSpy).toHaveBeenCalledWith(id, symmetricKey, userId);
      expect(result).toEqual(mockIMedication);
    });

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
    it('should update and return the updated medication', async () => {
      const id = mockIMedication.id;
      const updateDto: UpdateMedicationDto = {
        notes: 'Updated note',
      };
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto, mockRequest);

      expect(updateSpy).toHaveBeenCalledWith(
        id,
        updateDto,
        symmetricKey,
        userId,
      );
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
    it('should remove a medication', async () => {
      const id = mockIMedication.id;
      const removeSpy = jest.spyOn(service, 'remove');

      const result = await controller.remove(id, mockRequest);

      expect(removeSpy).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should rethrow NotFoundException from service during remove', async () => {
      const id = 'nonExistentId';
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException());
      const removeSpy = jest.spyOn(service, 'remove');

      await expect(controller.remove(id, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(removeSpy).toHaveBeenCalledWith(id, userId);
    });
  });

  describe('getMedicationTitles', () => {
    it('should return an array of medication titles', async () => {
      const findAllSpy = jest.spyOn(service, 'getMedicationTitles');
      const result = await controller.getMedicationTitles(mockRequest);

      expect(findAllSpy).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual(expect.arrayContaining(Array.from(titleSet)));
    });
  });
});
