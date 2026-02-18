/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import { Location, LocationDocument } from './schemas/locations.schema';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { WeatherService } from '../weather/weather.service';
import { SolarWeatherService } from '../solar/solar-weather.service';
import { GetSummaryQueryDto } from './dto/summary.dto';

const userId = 'user123';
const latitudeValue = 40.7128;
const latitudeUpdatedValue = 41.0;
const longitudeValue = -74.006;
const longitudeUpdatedValue = -75.001;
const locationDateTime = '2023-01-01T12:00:00.000Z';
const locationUpdatedDateTime = '2023-01-03T12:00:00.000Z';

const mockLocation: HydratedDocument<Location> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId,
  latitude: `enc(${latitudeValue})`,
  longitude: `enc(${longitudeValue})`,
  forecast: [],
  solar: [],
  solarRadiation: [],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${locationDateTime})`,
  toObject: function () {
    return this;
  },
} as never;

const mockUpdatedLocation: HydratedDocument<Location> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId,
  latitude: `enc(${latitudeUpdatedValue})`,
  longitude: `enc(${longitudeUpdatedValue})`,
  forecast: [],
  solar: [],
  solarRadiation: [],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: `enc(${locationUpdatedDateTime})`,
  incidentId: '1',
  toObject: function () {
    return this;
  },
} as never;

type MockLocation = Partial<Location> & { id?: string; _id?: Types.ObjectId };

const mockLocations: MockLocation[] = [
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
    userId,
    latitude: `enc(${latitudeValue})`,
    longitude: `enc(${longitudeValue})`,
    forecast: [],
    createdAt: new Date('2023-01-01T10:00:00Z'),
    datetimeAt: `enc(${locationDateTime})`,
    incidentId: '1',
  },
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    latitude: `enc(51.5074)`,
    longitude: `enc(-0.1278)`,
    forecast: [],
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: `enc(2023-01-02T12:00:00.000Z)`,
    incidentId: '2',
  },
];

describe('LocationsService', () => {
  let service: LocationsService;
  let mockLocationModel: jest.Mocked<Model<LocationDocument>>;
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

  const mockWeatherService = {
    getHourlyForecast: jest.fn(),
  };

  const mockSolarWeatherService = {
    getClosestStation: jest.fn(),
    getRadiationData: jest.fn(),
    getKpData: jest.fn(),
  };

  beforeEach(async () => {
    const mockDocumentInstance = {
      ...mockLocation,
      save: jest.fn().mockResolvedValue(mockLocation),
    } as unknown as LocationDocument;

    mockLocationModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<LocationDocument>>;

    mockLocationModel.find = jest.fn().mockImplementation((query = {}) => {
      const uId = query['userId'] as string;
      const matched = uId
        ? mockLocations.filter((l) => l.userId === uId)
        : mockLocations;
      return {
        exec: jest.fn().mockResolvedValue(matched),
      };
    });

    mockLocationModel.findById = jest.fn().mockImplementation((id: string) => {
      const found =
        mockLocations.find((l) => l.id === id || l._id!.toHexString() === id) ||
        null;
      return { exec: jest.fn().mockResolvedValue(found) };
    });

    mockLocationModel.create = jest
      .fn()
      .mockResolvedValue(mockDocumentInstance);
    mockLocationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedLocation),
    });
    mockLocationModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    module = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getModelToken(Location.name),
          useValue: mockLocationModel,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
        {
          provide: SolarWeatherService,
          useValue: mockSolarWeatherService,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
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
    it('should create and return a location', async () => {
      const createDto: CreateLocationDto = {
        userId: 'testUser',
        latitude: 40.7128,
        longitude: -74.006,
        datetimeAt: new Date().toISOString(),
        forecast: [],
      };

      const result = await service.create(createDto, symmetricKey);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const calledWithPayload = (mockLocationModel as unknown as jest.Mock).mock
        .calls[0][0];

      expect(calledWithPayload).toEqual(
        expect.objectContaining({
          latitude: `enc(${createDto.latitude})`,
          longitude: `enc(${createDto.longitude})`,
          datetimeAt: `enc(${createDto.datetimeAt})`,
        }),
      );

      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.latitude.toString(),
        bufferKey,
      );
      expect(encryptionService.encryptSensitiveData).toHaveBeenCalledWith(
        createDto.longitude.toString(),
        bufferKey,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockLocation._id.toString(),
          userId: mockLocation.userId,
          latitude: createDto.latitude,
          longitude: createDto.longitude,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of decrypted locations for user', async () => {
      const result = await service.findAll(symmetricKey, userId);

      expect(mockLocationModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(latitudeValue);
      expect(result[0].longitude).toBe(longitudeValue);
      expect(result[0].datetimeAt).toEqual(new Date(locationDateTime));
    });

    it('should return empty array for unknown user', async () => {
      const result = await service.findAll(symmetricKey, 'unknownUser');
      expect(mockLocationModel.find).toHaveBeenCalledWith({
        userId: 'unknownUser',
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single decrypted location', async () => {
      const result = await service.findOne(
        mockLocation._id.toHexString(),
        symmetricKey,
        userId,
      );

      expect(mockLocationModel.findById).toHaveBeenCalledWith(
        mockLocation._id.toHexString(),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockLocation._id.toString(),
          userId,
          latitude: latitudeValue,
          longitude: longitudeValue,
        }),
      );
    });

    it('should throw NotFoundException if location not found', async () => {
      mockLocationModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(
        service.findOne('nonExistentId', symmetricKey, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId does not match', async () => {
      await expect(
        service.findOne(
          mockLocation._id.toHexString(),
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw Error if decrypted value is not a string', async () => {
      const invalidLocation = {
        ...mockLocation,
        latitude: 123,
      };

      mockLocationModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidLocation),
      });

      await expect(
        service.findOne(mockLocation._id.toHexString(), symmetricKey, userId),
      ).rejects.toThrow(Error);
    });
  });

  describe('findByIncidentId', () => {
    it('should return a decrypted location by incidentId', async () => {
      mockLocationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLocation),
      });

      const result = await service.findByIncidentId('1', symmetricKey, userId);

      expect(mockLocationModel.findOne).toHaveBeenCalledWith({
        incidentId: '1',
        userId,
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: mockLocation._id.toString(),
          userId,
          latitude: latitudeValue,
          longitude: longitudeValue,
        }),
      );
    });

    it('should throw NotFoundException if location for incidentId not found', async () => {
      mockLocationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findByIncidentId('nonExistentIncidentId', symmetricKey, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the updated location', async () => {
      const updateDto: UpdateLocationDto = {
        latitude: latitudeUpdatedValue,
        longitude: longitudeUpdatedValue,
        datetimeAt: locationUpdatedDateTime,
      };

      const result = await service.update(
        mockLocation._id.toHexString(),
        updateDto,
        symmetricKey,
        userId,
      );

      expect(mockLocationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockLocation._id.toHexString(),
        expect.objectContaining({
          latitude: `enc(${updateDto.latitude})`,
          longitude: `enc(${updateDto.longitude})`,
          datetimeAt: `enc(${updateDto.datetimeAt})`,
        }),
        { new: true },
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockUpdatedLocation._id.toHexString(),
          userId: userId,
          longitude: longitudeUpdatedValue,
          latitude: latitudeUpdatedValue,
          solar: [],
          solarRadiation: [],
          forecast: [],
          createdAt: new Date('2023-01-01T10:00:00Z'),
          datetimeAt: new Date(locationUpdatedDateTime),
          incidentId: '1',
        }),
      );
    });

    it('should throw NotFoundException if location not found during update', async () => {
      mockLocationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });
      mockLocationModel.findById = jest.fn().mockReturnValue({
        exec: () => mockLocation,
      });

      await expect(
        service.update(
          mockLocation._id.toHexString(),
          { latitude: 10 },
          symmetricKey,
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if location not found', async () => {
      mockLocationModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update(
          mockLocation._id.toHexString(),
          { latitude: 10 },
          symmetricKey,
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId mismatch during update', async () => {
      await expect(
        service.update(
          mockLocation._id.toHexString(),
          { latitude: 10 },
          symmetricKey,
          'otherUser',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a location', async () => {
      await service.remove(mockLocation._id.toHexString(), userId);

      expect(mockLocationModel.deleteOne).toHaveBeenCalledWith({
        _id: mockLocation._id.toHexString(),
        userId,
      });
    });

    it('should throw NotFoundException if location not found during remove', async () => {
      mockLocationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if removing another users location', async () => {
      mockLocationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(
        service.remove(mockLocation._id.toHexString(), 'otherUser'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDateRange', () => {
    it('should return an array of decrypted locations for user and date range', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-02T23:59:59Z');
      const result = await service.findByDateRange(
        symmetricKey,
        userId,
        startDate,
        endDate,
      );

      expect(mockLocationModel.find).toHaveBeenCalledWith({
        userId,
        datetimeAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(latitudeValue);
      expect(result[0].longitude).toBe(longitudeValue);
      expect(result[0].datetimeAt).toEqual(new Date(locationDateTime));
    });

    it('should return empty array for unknown user ', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-02T23:59:59Z');
      const result = await service.findByDateRange(
        symmetricKey,
        'unknownUser',
        startDate,
        endDate,
      );
      expect(mockLocationModel.find).toHaveBeenCalledWith({
        userId: 'unknownUser',
        datetimeAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('getSummary', () => {
    it('should return a mapped summary object', async () => {
      const urlStation = 'http://example.com/station123';
      const query: GetSummaryQueryDto = {
        longitude: longitudeValue,
        latitude: latitudeValue,
        isoDate: '2023-01-01',
        id: mockLocation._id.toHexString(),
        incidentId: '1',
      };

      mockWeatherService.getHourlyForecast.mockResolvedValue([
        {
          time: '2023-01-01T12:00:00Z',
          temperature: 25,
          condition: 'Sunny',
        },
      ]);

      mockSolarWeatherService.getClosestStation.mockResolvedValue({
        stationId: 'station123',
        title: 'Test Station',
        url: urlStation,
      });

      mockSolarWeatherService.getRadiationData.mockResolvedValue([
        {
          time: '2023-01-01T12:00:00Z',
          radiation: 500,
        },
      ]);

      const result = await service.getSummary(query, userId);

      expect(result).toEqual(
        expect.objectContaining({
          id: mockLocation._id.toString(),
          userId,
          latitude: latitudeValue,
          longitude: longitudeValue,
        }),
      );
    });
  });
});
