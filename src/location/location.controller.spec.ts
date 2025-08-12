import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ILocationData } from './interfaces/location.interface';
import { NotFoundException } from '@nestjs/common';

const mockILocation: ILocationData = {
  id: '60c72b2f9b1d8e001c8e4d3a',
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
  datetimeAt: new Date('2023-01-01T10:00:00Z'),
  incidentId: 'incident123',
};

const mockILocations: ILocationData[] = [
  mockILocation,
  {
    id: '60c72b2f9b1d8e001c8e4d3b',
    userId: 'user456',
    latitude: 34.0522,
    longitude: -118.2437,
    forecast: [],
    solar: [],
    solarRadiation: [],
    datetimeAt: new Date('2023-01-02T10:00:00Z'),
    incidentId: null,
  },
];

const mockLocationService = {
  create: jest.fn().mockResolvedValue(mockILocation),
  findAll: jest.fn().mockResolvedValue(mockILocations),
  findOne: jest.fn().mockResolvedValue(mockILocation),
  update: jest.fn().mockResolvedValue(mockILocation),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('LocationController', () => {
  let controller: LocationController;
  let service: LocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    service = module.get<LocationService>(LocationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a location entry and return it', async () => {
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
      const createSpy = jest.spyOn(service, 'create');

      const result = await controller.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockILocation);
    });
  });

  describe('findAll', () => {
    it('should return an array of location entries', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual(mockILocations);
    });
  });

  describe('findOne', () => {
    it('should return a single location entry', async () => {
      const id = mockILocation.id;
      const findOneSpy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne(id);

      expect(findOneSpy).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockILocation);
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
    it('should update and return the updated location entry', async () => {
      const id = mockILocation.id;
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
      const updateSpy = jest.spyOn(service, 'update');

      const result = await controller.update(id, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockILocation);
    });

    it('should rethrow NotFoundException from service during update', async () => {
      const id = 'nonExistentId';
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
    it('should remove a location entry', async () => {
      const id = mockILocation.id;
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
