import { Injectable } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  dtoToJsonSchema,
  ClassType,
  JsonSchema,
} from './utils/dto-to-json-schema';
import { CreateIncidentDto } from '../incidents/dto/create-incident.dto';
import { CreateTriggerDto } from '../triggers/dto/create-trigger.dto';
import { CreateSymptomDto } from '../symptoms/dto/create-symptom.dto';
import { CreateMedicationDto } from '../medications/dto/create-medication.dto';
import { CreateLocationDto } from '../locations/dto/create-locations.dto';
import {
  CreateWaterDto,
  CreateBloodPressureDto,
  CreateHeightDto,
  CreateSleepDto,
  CreateWeightDto,
} from '../health-logs/dto/create-health-logs.dto';
import { DataValidationResponse } from './interface/validation.interface';

@Injectable()
export class DataManagementService {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  getSchema(): JsonSchema {
    // Incident schema
    const incidentObjectSchema = dtoToJsonSchema(
      CreateIncidentDto as ClassType<unknown>,
    );

    incidentObjectSchema.properties = incidentObjectSchema.properties ?? {};
    incidentObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    incidentObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    let existingRequired = Array.isArray(incidentObjectSchema.required)
      ? incidentObjectSchema.required
      : [];
    let requiredSet = new Set<string>(existingRequired);
    ['userId', 'type', 'startTime', 'datetimeAt'].forEach((r) =>
      requiredSet.add(r),
    );
    incidentObjectSchema.required = Array.from(requiredSet);

    const incidentsSchema: JsonSchema = {
      type: 'array',
      items: incidentObjectSchema,
    };

    // Trigger schema
    const triggerObjectSchema = dtoToJsonSchema(
      CreateTriggerDto as ClassType<unknown>,
    );
    triggerObjectSchema.properties = triggerObjectSchema.properties ?? {};
    triggerObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    triggerObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(triggerObjectSchema.required)
      ? triggerObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'type', 'datetimeAt'].forEach((r) => requiredSet.add(r));
    triggerObjectSchema.required = Array.from(requiredSet);

    const triggersSchema: JsonSchema = {
      type: 'array',
      items: triggerObjectSchema,
    };

    // Symptoms schema
    const symptomObjectSchema = dtoToJsonSchema(
      CreateSymptomDto as ClassType<unknown>,
    );
    symptomObjectSchema.properties = symptomObjectSchema.properties ?? {};
    symptomObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    symptomObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(symptomObjectSchema.required)
      ? symptomObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'type', 'severity', 'datetimeAt'].forEach((r) =>
      requiredSet.add(r),
    );
    symptomObjectSchema.required = Array.from(requiredSet);

    const symptomsSchema: JsonSchema = {
      type: 'array',
      items: symptomObjectSchema,
    };

    // Medications schema
    const medicationObjectSchema = dtoToJsonSchema(
      CreateMedicationDto as ClassType<unknown>,
    );
    medicationObjectSchema.properties = medicationObjectSchema.properties ?? {};
    medicationObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    medicationObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(medicationObjectSchema.required)
      ? medicationObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'type', 'dosage', 'datetimeAt'].forEach((r) =>
      requiredSet.add(r),
    );
    medicationObjectSchema.required = Array.from(requiredSet);

    const medicationsSchema: JsonSchema = {
      type: 'array',
      items: medicationObjectSchema,
    };

    // Location schema
    const locationObjectSchema = dtoToJsonSchema(
      CreateLocationDto as ClassType<unknown>,
    );
    locationObjectSchema.properties = locationObjectSchema.properties ?? {};
    locationObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    locationObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(locationObjectSchema.required)
      ? locationObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'datetimeAt'].forEach((r) => requiredSet.add(r));
    locationObjectSchema.required = Array.from(requiredSet);

    const locationsSchema: JsonSchema = {
      type: 'array',
      items: locationObjectSchema,
    };

    // Health logs
    // Weight schema
    const weightObjectSchema = dtoToJsonSchema(
      CreateWeightDto as ClassType<unknown>,
    );
    weightObjectSchema.properties = weightObjectSchema.properties ?? {};
    weightObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    weightObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(weightObjectSchema.required)
      ? weightObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'weight', 'datetimeAt'].forEach((r) => requiredSet.add(r));
    weightObjectSchema.required = Array.from(requiredSet);

    const weightsSchema: JsonSchema = {
      type: 'array',
      items: weightObjectSchema,
    };

    // Height schema
    const heightObjectSchema = dtoToJsonSchema(
      CreateHeightDto as ClassType<unknown>,
    );
    heightObjectSchema.properties = heightObjectSchema.properties ?? {};
    heightObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    heightObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(heightObjectSchema.required)
      ? heightObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'height', 'datetimeAt'].forEach((r) => requiredSet.add(r));
    heightObjectSchema.required = Array.from(requiredSet);

    const heightsSchema: JsonSchema = {
      type: 'array',
      items: heightObjectSchema,
    };

    // Blood pressure
    const bloodPressureObjectSchema = dtoToJsonSchema(
      CreateBloodPressureDto as ClassType<unknown>,
    );
    bloodPressureObjectSchema.properties =
      bloodPressureObjectSchema.properties ?? {};
    bloodPressureObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    bloodPressureObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(bloodPressureObjectSchema.required)
      ? bloodPressureObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'systolic', 'diastolic', 'datetimeAt'].forEach((r) =>
      requiredSet.add(r),
    );
    bloodPressureObjectSchema.required = Array.from(requiredSet);

    const bloodPressuresSchema: JsonSchema = {
      type: 'array',
      items: bloodPressureObjectSchema,
    };

    // Sleeps schema
    const sleepObjectSchema = dtoToJsonSchema(
      CreateSleepDto as ClassType<unknown>,
    );
    sleepObjectSchema.properties = sleepObjectSchema.properties ?? {};
    sleepObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    sleepObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(sleepObjectSchema.required)
      ? sleepObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'rate', 'minutesTotal', 'datetimeAt'].forEach((r) =>
      requiredSet.add(r),
    );
    sleepObjectSchema.required = Array.from(requiredSet);

    const sleepsSchema: JsonSchema = {
      type: 'array',
      items: sleepObjectSchema,
    };

    //Waters
    const waterObjectSchema = dtoToJsonSchema(
      CreateWaterDto as ClassType<unknown>,
    );
    waterObjectSchema.properties = waterObjectSchema.properties ?? {};
    waterObjectSchema.properties.id = { type: 'string' } as JsonSchema;
    waterObjectSchema.properties.createdAt = {
      type: 'string',
      format: 'date-time',
    } as JsonSchema;

    existingRequired = Array.isArray(waterObjectSchema.required)
      ? waterObjectSchema.required
      : [];
    requiredSet = new Set<string>(existingRequired);
    ['userId', 'ml', 'datetimeAt'].forEach((r) => requiredSet.add(r));
    waterObjectSchema.required = Array.from(requiredSet);

    const watersSchema: JsonSchema = {
      type: 'array',
      items: waterObjectSchema,
    };

    const healthLogsSchema: JsonSchema = {
      type: 'object',
      properties: {
        weights: weightsSchema,
        heights: heightsSchema,
        bloodPressures: bloodPressuresSchema,
        sleeps: sleepsSchema,
        waters: watersSchema,
      },
    };

    // Overvall schema
    const rootSchema: JsonSchema = {
      type: 'object',
      properties: {
        incidents: incidentsSchema,
        triggers: triggersSchema,
        symptoms: symptomsSchema,
        medications: medicationsSchema,
        locations: locationsSchema,
        healthLogs: healthLogsSchema,
        exportedAt: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
      },
      required: [
        'incidents',
        'triggers',
        'symptoms',
        'medications',
        'locations',
        'healthLogs',
        'exportedAt',
        'version',
      ],
      additionalProperties: false,
    };

    return rootSchema;
  }

  validateImportData(data: unknown): DataValidationResponse {
    const schema: JsonSchema = this.getSchema();
    const validate = this.ajv.compile(schema);
    const isValid = validate(data);

    if (!isValid) {
      return { isValid: false, errors: validate.errors };
    }
    return { isValid: true };
  }
}
