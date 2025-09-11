import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './locations.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import {
  Location,
  LocationDocument,
  LocationSchema,
} from './schemas/locations.schema';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { NotFoundException, Logger } from '@nestjs/common';

/* eslint-disable @typescript-eslint/unbound-method */

const mockLocation: HydratedDocument<Location> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'),
  userId: 'user123',
  latitude: 40.7128,
  longitude: -74.006,
  forecast: [
    {
      description: 'clear sky',
      temperature: 20,
      pressure: 1012,
      humidity: 50,
      windSpeed: 5.5,
      clouds: 10,
      uvi: 5,
      datetime: '2023-01-01T10:00:00Z',
    },
  ],
  solar: [
    {
      kIndex: 3,
      aIndex: 5,
      flareProbability: 0.1,
      datetime: '2023-01-01T10:00:00Z',
    },
  ],
  solarRadiation: [
    {
      uviIndex: 5,
      ozone: 300,
      solarFlux: 100,
      sunsPotNumber: 50,
      date: '2023-01-01',
    },
  ],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
  incidentId: 'incident123',
} as never;

const mockLocations: HydratedDocument<Location>[] = [
  mockLocation,
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    latitude: 34.0522,
    longitude: -118.2437,
    forecast: [],
    solar: [],
    solarRadiation: [],
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
    incidentId: null,
  },
] as never;

describe('LocationService', () => {
  let service: LocationService;
  let model: Model<LocationDocument>;
  let mockLocationModel: jest.Mocked<Model<LocationDocument>>;
  let mockDocumentInstance: LocationDocument;
  let module: TestingModule;

  beforeEach(async () => {
    mockDocumentInstance = {
      ...mockLocation,
      save: jest.fn().mockResolvedValue(mockLocation),
    } as unknown as LocationDocument;

    mockLocationModel = jest.fn().mockImplementation(() => {
      return mockDocumentInstance;
    }) as unknown as jest.Mocked<Model<LocationDocument>>;

    mockLocationModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockLocations),
    });
    mockLocationModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockLocation),
    });
    mockLocationModel.create = jest
      .fn()
      .mockResolvedValue(mockDocumentInstance);
    mockLocationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentInstance),
    });
    mockLocationModel.deleteOne = jest.fn().mockReturnValue({
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
          { name: Location.name, schema: LocationSchema },
        ]),
      ],
      providers: [
        LocationService,
        {
          provide: getModelToken('Location'),
          useValue: mockLocationModel,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    model = module.get<Model<LocationDocument>>(getModelToken(Location.name));
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
    it('should create and return a location entry', async () => {
      const createDto: CreateLocationDto = {
        userId: 'testUser',
        latitude: 1,
        longitude: 1,
        forecast: [],
        solar: [],
        solarRadiation: [],
        datetimeAt: new Date(),
        incidentId: null,
      };

      const result = await service.create(createDto);

      expect(mockLocationModel).toHaveBeenCalledWith(createDto);
      expect(mockDocumentInstance.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockLocation._id.toString(),
        userId: mockLocation.userId,
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        forecast: mockLocation.forecast,
        solar: mockLocation.solar,
        solarRadiation: mockLocation.solarRadiation,
        datetimeAt: mockLocation.datetimeAt,
        incidentId: mockLocation.incidentId,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of location entries', async () => {
      const result = await service.findAll();

      expect(mockLocationModel.find).toHaveBeenCalled();
      expect(result).toEqual(
        mockLocations.map((t) => ({
          id: t._id.toString(),
          userId: t.userId,
          latitude: t.latitude,
          longitude: t.longitude,
          forecast: t.forecast,
          solar: t.solar,
          solarRadiation: t.solarRadiation,
          datetimeAt: t.datetimeAt,
          incidentId: t.incidentId,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single location entry', async () => {
      const result = await service.findOne(mockLocation._id.toHexString());

      expect(mockLocationModel.findById).toHaveBeenCalledWith(
        mockLocation._id.toHexString(),
      );
      expect(result).toEqual({
        id: mockLocation._id.toString(),
        userId: mockLocation.userId,
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        forecast: mockLocation.forecast,
        solar: mockLocation.solar,
        solarRadiation: mockLocation.solarRadiation,
        datetimeAt: mockLocation.datetimeAt,
        incidentId: mockLocation.incidentId,
      });
    });

    it('should throw NotFoundException if location entry not found', async () => {
      mockLocationModel.findById = jest.fn().mockReturnValue({
        exec: () => null,
      });
      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated location entry', async () => {
      const updateDto: UpdateLocationDto = {
        latitude: 2,
        longitude: 2,
        forecast: [
          {
            description: 'clear sky',
            temperature: 20,
            pressure: 1012,
            humidity: 50,
            windSpeed: 5.5,
            clouds: 10,
            uvi: 5,
            datetime: '2023-01-01T10:00:00Z',
          },
        ],
        solar: [
          {
            kIndex: 3,
            aIndex: 5,
            flareProbability: 0.1,
            datetime: '2023-01-01T10:00:00Z',
          },
        ],
        solarRadiation: [
          {
            uviIndex: 5,
            ozone: 300,
            solarFlux: 100,
            sunsPotNumber: 50,
            date: '2023-01-01',
          },
        ],
      };
      const updatedMockLocation = {
        ...mockLocation,
        latitude: 2,
        longitude: 2,
      };
      mockLocationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => updatedMockLocation,
      });

      const result = await service.update(
        mockLocation._id.toHexString(),
        updateDto,
      );

      expect(mockLocationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockLocation._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockLocation._id.toString(),
        userId: updatedMockLocation.userId,
        latitude: updatedMockLocation.latitude,
        longitude: updatedMockLocation.longitude,
        forecast: updatedMockLocation.forecast,
        solar: updatedMockLocation.solar,
        solarRadiation: updatedMockLocation.solarRadiation,
        datetimeAt: updatedMockLocation.datetimeAt,
        incidentId: updatedMockLocation.incidentId,
      });
    });

    it('should throw NotFoundException if location entry not found during update', async () => {
      mockLocationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: () => null,
      });

      await expect(
        service.update('nonExistentId', {
          latitude: 2,
          longitude: 2,
          forecast: [
            {
              description: 'clear sky',
              temperature: 20,
              pressure: 1012,
              humidity: 50,
              windSpeed: 5.5,
              clouds: 10,
              uvi: 5,
              datetime: '2023-01-01T10:00:00Z',
            },
          ],
          solar: [
            {
              kIndex: 3,
              aIndex: 5,
              flareProbability: 0.1,
              datetime: '2023-01-01T10:00:00Z',
            },
          ],
          solarRadiation: [
            {
              uviIndex: 5,
              ozone: 300,
              solarFlux: 100,
              sunsPotNumber: 50,
              date: '2023-01-01',
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a location entry', async () => {
      mockLocationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 1 }),
      });

      await service.remove(mockLocation._id.toHexString());

      expect(mockLocationModel.deleteOne).toHaveBeenCalledWith({
        _id: mockLocation._id.toHexString(),
      });
    });

    it('should throw NotFoundException if location entry not found during remove', async () => {
      mockLocationModel.deleteOne = jest.fn().mockReturnValue({
        exec: () => Promise.resolve({ deletedCount: 0 }),
      });

      await expect(service.remove('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLocationModel.deleteOne).toHaveBeenCalledWith({
        _id: 'nonExistentId',
      });
    });
  });
});
