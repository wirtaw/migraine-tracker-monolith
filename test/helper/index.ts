import { Types } from 'mongoose';

export function isObjectIdOrString(
  x: unknown,
): x is Types.ObjectId | string | undefined {
  return (
    x === undefined || typeof x === 'string' || x instanceof Types.ObjectId
  );
}

export function toIdString(id: Types.ObjectId | string | undefined): string {
  if (!id) return '';
  return typeof id === 'string' ? id : id.toString();
}
