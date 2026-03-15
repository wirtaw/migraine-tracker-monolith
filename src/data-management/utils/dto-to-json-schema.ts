import 'reflect-metadata';
import { getMetadataStorage } from 'class-validator';

export interface ClassType<T = unknown> {
  new (...args: unknown[]): T;
}

type PrimitiveTypeName = 'string' | 'number' | 'integer' | 'boolean' | 'null';

export interface PrimitiveSchema {
  type: PrimitiveTypeName;
  format?: string;
  enum?: (string | number | boolean | null)[];
}

export interface ArraySchema {
  type: 'array';
  items: JsonSchema;
}

export interface ObjectSchema {
  type: 'object';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export type JsonSchema = PrimitiveSchema | ArraySchema | ObjectSchema;

interface ValidationMetadataLite {
  propertyName: string;
  type: string;
  constraints?: unknown[];
  each?: boolean;
}

interface MetadataStorageLite {
  getTargetValidationMetadatas(
    targetConstructor: Function, // eslint-disable-line @typescript-eslint/no-unsafe-function-type
    targetSchema?: string,
  ): ValidationMetadataLite[];
}

function asMetadataStorage(obj: unknown): MetadataStorageLite | null {
  if (obj && typeof obj === 'object' && 'getTargetValidationMetadatas' in obj) {
    const cast = obj as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof cast.getTargetValidationMetadatas === 'function') {
      return cast as MetadataStorageLite;
    }
  }
  return null;
}

function mapValidatorToSchema(
  meta: ValidationMetadataLite | undefined,
  designType?: Function, // eslint-disable-line @typescript-eslint/no-unsafe-function-type
): JsonSchema {
  if (!meta) {
    if (designType === String) return { type: 'string' };
    if (designType === Number) return { type: 'number' };
    if (designType === Boolean) return { type: 'boolean' };
    if (designType === Array)
      return { type: 'array', items: { type: 'string' } };
    return { type: 'object', additionalProperties: true };
  }

  switch (meta.type) {
    case 'isString':
      return { type: 'string' };
    case 'isNumber':
      return { type: 'number' };
    case 'isInt':
      return { type: 'integer' };
    case 'isBoolean':
      return { type: 'boolean' };
    case 'isDateString':
      return { type: 'string', format: 'date-time' };
    case 'isUUID':
      return { type: 'string', format: 'uuid' };
    case 'isEmail':
      return { type: 'string', format: 'email' };
    case 'isArray':
      return { type: 'array', items: { type: 'string' } };
    case 'isEnum': {
      const maybeEnum = Array.isArray(meta.constraints?.[0])
        ? (meta.constraints[0] as (string | number | boolean)[])
        : undefined;
      const schema: PrimitiveSchema = { type: 'string' };
      if (maybeEnum) schema.enum = maybeEnum;
      return schema;
    }
    default:
      if (designType === String) return { type: 'string' };
      if (designType === Number) return { type: 'number' };
      if (designType === Boolean) return { type: 'boolean' };
      if (designType === Array)
        return { type: 'array', items: { type: 'string' } };
      return { type: 'object', additionalProperties: true };
  }
}

/**
 * Convert a DTO class to a JSON Schema object.
 */
export function dtoToJsonSchema<T = unknown>(
  dtoClass: ClassType<T>,
): ObjectSchema {
  const rawStorage = getMetadataStorage();
  const storage = asMetadataStorage(rawStorage);
  const metadatas: ValidationMetadataLite[] = storage
    ? storage.getTargetValidationMetadatas(dtoClass as unknown as Function, '') // eslint-disable-line @typescript-eslint/no-unsafe-function-type
    : [];

  const byProp = new Map<string, ValidationMetadataLite[]>();
  for (const m of metadatas) {
    const prop = m.propertyName;
    const arr = byProp.get(prop) ?? [];
    arr.push(m);
    byProp.set(prop, arr);
  }

  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const [prop, metas] of byProp.entries()) {
    const designType = Reflect.getMetadata(
      'design:type',
      dtoClass.prototype, // eslint-disable-line @typescript-eslint/no-unsafe-argument
      prop,
    ) as Function | undefined; // eslint-disable-line @typescript-eslint/no-unsafe-function-type

    const isArray = metas.some((m) => m.type === 'isArray');
    if (isArray) {
      const eachMeta = metas.find(
        (m) => m.each === true && m.type !== 'isArray',
      );
      const itemsSchema = mapValidatorToSchema(eachMeta, undefined);
      properties[prop] = { type: 'array', items: itemsSchema };
    } else {
      const preferredOrder = [
        'isDateString',
        'isEnum',
        'isNumber',
        'isInt',
        'isBoolean',
        'isUUID',
        'isEmail',
        'isString',
        'isObject',
      ];
      let chosen: ValidationMetadataLite | undefined;
      for (const t of preferredOrder) {
        chosen = metas.find((m) => m.type === t);
        if (chosen) break;
      }
      if (!chosen) chosen = metas[0];

      const propSchema = mapValidatorToSchema(chosen, designType);

      const hasNested = metas.some((m) => m.type === 'nestedValidation');
      if (
        hasNested &&
        designType &&
        designType !== Object &&
        designType !== Array
      ) {
        properties[prop] = dtoToJsonSchema(designType as ClassType<unknown>);
      } else {
        properties[prop] = propSchema;
      }
    }

    const isOptional = metas.some((m) => m.type === 'isOptional');
    const hasNotEmpty = metas.some((m) => m.type === 'isNotEmpty');
    if (!isOptional && hasNotEmpty) required.push(prop);
  }

  const schema: ObjectSchema = {
    type: 'object',
    properties,
    additionalProperties: false,
  };
  if (required.length) schema.required = required;
  return schema;
}
