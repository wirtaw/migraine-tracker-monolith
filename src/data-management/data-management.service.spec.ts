import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { DataManagementService } from './data-management.service';
import { JsonSchema } from './utils/dto-to-json-schema';
import { Logger } from '@nestjs/common';
import { DataValidationResponse } from './interface/validation.interface';

describe('DataManagementService', () => {
  let service: DataManagementService;
  const userId = crypto.randomUUID();
  const mockBackupData = {
    incidents: [
      {
        id: crypto.randomBytes(16).toString('base64'),
        userId,
        type: 'Migraine Attack',
        startTime: '2026-03-10T13:00:00.000Z',
        durationHours: 3,
        triggers: ['Lack of Sleep'],
        createdAt: '2026-03-14T16:07:57.032Z',
        datetimeAt: '2026-03-10T13:00:00.000Z',
      },
    ],
    healthLogs: {
      weights: [
        {
          id: crypto.randomBytes(16).toString('base64'),
          userId,
          weight: 76,
          datetimeAt: '2026-03-05T10:27:00.000Z',
        },
      ],
      heights: [
        {
          id: crypto.randomBytes(16).toString('base64'),
          userId,
          height: 169,
          datetimeAt: '2026-03-05T10:27:00.000Z',
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataManagementService],
    }).compile();

    service = module.get<DataManagementService>(DataManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should dynamically generate a valid JSON schema', () => {
    const schema: JsonSchema = service.getSchema();
    expect(schema).toBeDefined();
    expect(schema.type).toBe('object');
  });

  it('should successfully validate a properly formatted backup JSON', () => {
    const result: DataValidationResponse =
      service.validateImportData(mockBackupData);

    if (!result.isValid) {
      Logger.error(result.errors);
    }

    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should reject malformed data (missing required fields)', () => {
    const badMockData = {
      incidents: mockBackupData.incidents,
    };

    const result: DataValidationResponse =
      service.validateImportData(badMockData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain(
      "must have required property 'healthLogs'",
    );
  });
});
