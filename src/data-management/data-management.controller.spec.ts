import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { DataManagementController } from './data-management.controller';
import { DataManagementService } from './data-management.service';
import { JsonSchema } from './utils/dto-to-json-schema';
import { DataValidationResponse } from './interface/validation.interface';

const schema: JsonSchema = {
  type: 'object',
  properties: {
    incident: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
        },
      },
    },
  },
};

const validationResponse: DataValidationResponse = { isValid: true };

const mockDataManagementService: {
  getSchema: (this: void) => JsonSchema;
  validateImportData: (this: void) => DataValidationResponse;
} = {
  getSchema: jest.fn().mockReturnValue(schema),
  validateImportData: jest.fn().mockReturnValue(validationResponse),
};

describe('DataManagementController', () => {
  let controller: DataManagementController;
  let service: DataManagementService;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [DataManagementController],
      providers: [
        {
          provide: DataManagementService,
          useValue: mockDataManagementService,
        },
      ],
    }).compile();

    controller = module.get<DataManagementController>(DataManagementController);
    service = module.get<DataManagementService>(DataManagementService);
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

  describe('getSchema', () => {
    it('should get schema', () => {
      const result: JsonSchema = controller.getSchema();
      expect(service.getSchema).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(schema);
    });
  });

  describe('validateUpload', () => {
    it('should validate uploaded JSON file', () => {
      const file = {
        buffer: Buffer.from(
          `{"incident": [{"id": "${crypto.randomBytes(16).toString('base64')}"}]}`,
          'utf-8',
        ),
        mimetype: 'application/json',
      } as Express.Multer.File;
      jest
        .spyOn(service, 'validateImportData')
        .mockReturnValue(validationResponse);

      const result: DataValidationResponse = controller.validateFile(file);

      expect(service.validateImportData).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(validationResponse);
    });
  });
});
