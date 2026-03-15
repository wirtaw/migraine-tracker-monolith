import { ErrorObject } from 'ajv';

export interface DataValidationResponse {
  isValid: boolean;
  errors?: ErrorObject<string, Record<string, any>, unknown>[] | null; // eslint-disable-line @typescript-eslint/no-explicit-any
}
