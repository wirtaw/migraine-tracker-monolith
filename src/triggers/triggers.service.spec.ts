// src/trigger/triggers.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TriggersService } from './triggers.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import { Trigger, TriggerDocument } from './schemas/trigger.schema';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { NotFoundException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

// Mock data
const mockTrigger: HydratedDocument<Trigger> = {
  _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3a'), // Example ObjectId
  userId: 'user123',
  type: 'Headache',
  note: 'Started after stress',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  datetimeAt: new Date('2023-01-01T12:00:00Z'),
} as any; // Cast as any to satisfy Document interface if not fully implemented in mock

const mockTriggers: HydratedDocument<Trigger>[] = [
  mockTrigger,
  {
    _id: new Types.ObjectId('60c72b2f9b1d8e001c8e4d3b'),
    userId: 'user456',
    type: 'Migraine',
    note: 'Visual aura',
    createdAt: new Date('2023-01-02T10:00:00Z'),
    datetimeAt: new Date('2023-01-02T12:00:00Z'),
  },
] as any;

// Mock the Mongoose Model methods
const mockTriggerModel = {
  // Mock 'save' for create operations
  create: jest.fn().mockImplementation((dto: CreateTriggerDto) =>
    Promise.resolve({
      _id: new Types.ObjectId(), // Generate a new ID for the created item
      ...dto,
      createdAt: new Date(),
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...dto,
        createdAt: new Date(),
      }),
    } as HydratedDocument<Trigger>),
  ),

  // For find operations
  find: jest.fn().mockReturnThis(), // Allow chaining .exec()
  findById: jest.fn().mockReturnThis(), // Allow chaining .exec()
  exec: jest.fn(), // This will be chained after find/findById

  // For update operations
  findByIdAndUpdate: jest.fn().mockReturnThis(),

  // For delete operations
  deleteOne: jest.fn().mockReturnThis(),
};

describe('TriggersService', () => {
  let service: TriggersService;
  let model: Model<TriggerDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriggersService,
        {
          provide: getModelToken('Trigger'), // Use the name of your Mongoose model
          useValue: mockTriggerModel,
        },
      ],
    }).compile();

    service = module.get<TriggersService>(TriggersService);
    model = module.get<Model<TriggerDocument>>(getModelToken('Trigger'));
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it.skip('should create and return a trigger', async () => {
      const createDto: CreateTriggerDto = {
        userId: 'testUser',
        type: 'TestType',
        note: 'Test note',
        datetimeAt: new Date(),
      };

      // Mock the save method for the instance created by `new this.triggerModel(createTriggerDto)`
      const mockSave = jest.fn().mockResolvedValue(mockTrigger);
      jest.spyOn(model, 'create').mockImplementationOnce(
        () =>
          ({
            save: mockSave,
          }) as any,
      ); // Mock the instance's save method

      // Temporarily mock the constructor of the model to return an object with a save method
      const modelConstructorSpy = jest
        .spyOn(model.constructor as any, 'name', 'get')
        .mockReturnValue('Trigger'); // Mock the name property
      //TODO fix test type
      /*jest.spyOn(model, 'constructor').mockImplementation(function (data) {
        this.save = mockSave;
        Object.assign(this, data);
        return this;
      } as any);*/

      const result = await service.create(createDto);

      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockTrigger._id.toString(), // Expect id as string
        ...mockTrigger,
        _id: undefined, // _id should not be in the final ITrigger object
      });

      // Restore original constructor if needed, though afterEach clears mocks
      modelConstructorSpy.mockRestore();
    });

    // Simpler mock for create, assuming `create` directly on the model
    it.skip('should create a trigger (simpler mock for Model.create)', async () => {
      const createDto: CreateTriggerDto = {
        userId: 'testUser',
        type: 'TestType',
        note: 'Test note',
        datetimeAt: new Date(),
      };

      // Mock Model.create to return a mocked document
      // TODO fix test
      //jest.spyOn(model, 'create').mockResolvedValueOnce(mockTrigger);
      const createSpy = jest.spyOn(model, 'create');

      const result = await service.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        id: mockTrigger._id.toString(),
        userId: mockTrigger.userId,
        type: mockTrigger.type,
        note: mockTrigger.note,
        createdAt: mockTrigger.createdAt,
        datetimeAt: mockTrigger.datetimeAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of triggers', async () => {
      mockTriggerModel.exec.mockResolvedValueOnce(mockTriggers); // Mock exec for find()
      const findSpy = jest.spyOn(model, 'find');

      const result = await service.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual(
        mockTriggers.map((t) => ({
          id: t._id.toString(),
          userId: t.userId,
          type: t.type,
          note: t.note,
          createdAt: t.createdAt,
          datetimeAt: t.datetimeAt,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single trigger', async () => {
      mockTriggerModel.exec.mockResolvedValueOnce(mockTrigger); // Mock exec for findById()
      const findByIdSpy = jest.spyOn(model, 'findById');

      const result = await service.findOne(mockTrigger._id.toHexString());

      expect(findByIdSpy).toHaveBeenCalledWith(mockTrigger._id.toHexString());
      expect(result).toEqual({
        id: mockTrigger._id.toString(),
        userId: mockTrigger.userId,
        type: mockTrigger.type,
        note: mockTrigger.note,
        createdAt: mockTrigger.createdAt,
        datetimeAt: mockTrigger.datetimeAt,
      });
    });

    it('should throw NotFoundException if trigger not found', async () => {
      mockTriggerModel.exec.mockResolvedValueOnce(null); // Mock exec to return null

      await expect(service.findOne('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated trigger', async () => {
      const updateDto: UpdateTriggerDto = {
        note: 'Updated note',
        userId: mockTrigger.userId,
        type: mockTrigger.type,
      };
      const updatedMockTrigger = { ...mockTrigger, note: 'Updated note' };
      const findByIdAndUpdateSpy = jest.spyOn(model, 'findByIdAndUpdate');
      mockTriggerModel.exec.mockResolvedValueOnce(updatedMockTrigger); // Mock exec for findByIdAndUpdate()

      const result = await service.update(
        mockTrigger._id.toHexString(),
        updateDto,
      );

      expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
        mockTrigger._id.toHexString(),
        updateDto,
        { new: true },
      );
      expect(result).toEqual({
        id: updatedMockTrigger._id.toString(),
        userId: updatedMockTrigger.userId,
        type: updatedMockTrigger.type,
        note: updatedMockTrigger.note,
        createdAt: updatedMockTrigger.createdAt,
        datetimeAt: updatedMockTrigger.datetimeAt,
      });
    });

    it('should throw NotFoundException if trigger not found during update', async () => {
      mockTriggerModel.exec.mockResolvedValueOnce(null); // Mock exec to return null

      await expect(
        service.update('nonExistentId', {
          note: 'test',
          userId: mockTrigger.userId,
          type: mockTrigger.type,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // TODO fix test
  describe.skip('remove', () => {
    it('should remove a trigger', async () => {
      jest.spyOn(mockTriggerModel.deleteOne().exec(), 'mockResolvedValueOnce') // Spy on the exec method
          .mockResolvedValueOnce({ deletedCount: 1 }); // Mock deleteOne
          const removeSpy = jest.spyOn(service, 'remove');

      await service.remove(mockTrigger._id.toHexString());

      expect(removeSpy).toHaveBeenCalledWith({
        _id: mockTrigger._id.toHexString(),
      });
    });

    it('should throw NotFoundException if trigger not found during remove', async () => {
      const removeSpy = jest.spyOn(service, 'remove').mockRejectedValueOnce(new NotFoundException());

      jest.spyOn(mockTriggerModel.deleteOne().exec(), 'mockResolvedValueOnce') // Spy on the exec method
          .mockResolvedValueOnce({ deletedCount: 0 }); // Mock no deletion

      await expect(service.remove('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
      expect(removeSpy).toHaveBeenCalledWith('nonExistentId');
    });
  });
});
