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
    triggers: [
      {
        id: crypto.randomBytes(16).toString('base64'),
        userId,
        type: 'Weather',
        createdAt: '2026-03-14T16:07:57.109Z',
        datetimeAt: '2026-03-03T10:26:00.000Z',
      },
    ],
    medications: [
      {
        id: crypto.randomBytes(16).toString('base64'),
        userId,
        title: 'Amoxicillin',
        dosage: '1mg',
        datetimeAt: '2026-03-02T10:26:00.000Z',
        createdAt: '2026-03-14T16:07:57.112Z',
      },
    ],
    symptoms: [
      {
        id: crypto.randomBytes(16).toString('base64'),
        userId,
        type: 'Headache',
        severity: 5,
        createdAt: '2026-03-14T16:07:57.114Z',
        datetimeAt: '2026-03-01T10:26:00.000Z',
      },
    ],
    locations: [
      {
        id: crypto.randomBytes(16).toString('base64'),
        userId,
        latitude: 10,
        longitude: -12,
        forecast: [
          {
            description: '',
            temperature: 7.345,
            pressure: 1005.85,
            humidity: 82,
            windSpeed: 3.09,
            clouds: 51,
            uvi: 0,
            datetime: '2026-03-10T22:00:00.000Z',
          },
        ],
        solar: [
          {
            kIndex: 3.333,
            aIndex: 18,
            datetime: '2026-03-10T00:00:00.000Z',
          },
        ],
        solarRadiation: [
          {
            ozone: 359.2,
            solarFlux: 0,
            sunsPotNumber: 0,
            date: '09 Mar 2026',
          },
          {
            ozone: 374.3,
            solarFlux: 126.9,
            sunsPotNumber: 83,
            date: '10 Mar 2026',
          },
          {
            ozone: 382.9,
            solarFlux: 122.8,
            sunsPotNumber: 116,
            date: '11 Mar 2026',
          },
        ],
        createdAt: '2026-03-14T16:07:57.114Z',
        datetimeAt: '2026-03-01T10:26:00.000Z',
      },
    ],
    exportedAt: '2026-03-01T10:26:00.000Z',
    version: '',
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
      bloodPressures: [
        {
          id: crypto.randomBytes(16).toString('base64'),
          userId,
          systolic: 111,
          diastolic: 77,
          datetimeAt: '2026-03-06T10:28:00.000Z',
        },
      ],
      sleeps: [
        {
          id: crypto.randomBytes(16).toString('base64'),
          userId,
          minutesTotal: 450,
          minutesDeep: 110,
          minutesRem: 10,
          timesWakeUp: 1,
          rate: 10,
          datetimeAt: '2026-03-07T06:28:00.000Z',
        },
      ],
      waters: [
        {
          id: crypto.randomBytes(16).toString('base64'),
          userId,
          ml: 700,
          datetimeAt: '2026-03-09T10:28:00.000Z',
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
      "must have required property 'triggers'",
    );
    expect(result.errors![1].message).toContain(
      "must have required property 'symptoms'",
    );
  });
});
