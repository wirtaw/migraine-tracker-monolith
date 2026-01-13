/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { ILocation } from './interfaces/locations.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

const mockILocation: ILocation = {
  id: '60c72b2f9b1d8e001c8e4d3a',
  userId: 'user123',
  latitude: 40.7128,
  longitude: -74.006,
  forecast: [],
  solarRadiation: undefined,
  solar: undefined,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
  incidentId: '1',
};

const mockLocationsService = {
  create: jest.fn().mockResolvedValue(mockILocation),
  findAll: jest.fn().mockResolvedValue([mockILocation]),
  findOne: jest.fn().mockResolvedValue(mockILocation),
  update: jest.fn().mockResolvedValue(mockILocation),
  remove: jest.fn().mockResolvedValue(undefined),
};

const symmetricKey = 'test-secret-key-long';
const userId = 'user123';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: LocationsService;
  let mockRequest: RequestWithUser;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
        {
          provide: EncryptionService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get<LocationsService>(LocationsService);

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
    it('should create a location', async () => {
      const createDto: CreateLocationDto = {
        userId: 'testUser',
        latitude: 40.7128,
        longitude: -74.006,
        datetimeAt: new Date().toISOString(),
      };
      const result = await controller.create(createDto, mockRequest);
      expect(service.create).toHaveBeenCalledWith(createDto, symmetricKey);
      expect(result).toEqual(mockILocation);
    });
  });

  describe('findAll', () => {
    it('should return list of locations', async () => {
      const result = await controller.findAll(mockRequest);
      expect(service.findAll).toHaveBeenCalledWith(symmetricKey, userId);
      expect(result).toEqual([mockILocation]);
    });
  });

  describe('findOne', () => {
    it('should return a location', async () => {
      const result = await controller.findOne(mockILocation.id, mockRequest);
      expect(service.findOne).toHaveBeenCalledWith(
        mockILocation.id,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockILocation);
    });
  });

  describe('update', () => {
    it('should update a location', async () => {
      const updateDto: UpdateLocationDto = { latitude: 41.0 };
      const result = await controller.update(
        mockILocation.id,
        updateDto,
        mockRequest,
      );
      expect(service.update).toHaveBeenCalledWith(
        mockILocation.id,
        updateDto,
        symmetricKey,
        userId,
      );
      expect(result).toEqual(mockILocation);
    });
  });

  describe('remove', () => {
    it('should remove a location', async () => {
      const result = await controller.remove(mockILocation.id, mockRequest);
      expect(service.remove).toHaveBeenCalledWith(mockILocation.id, userId);
      expect(result).toBeUndefined();
    });
  });
});
