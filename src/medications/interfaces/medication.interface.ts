// src/medications/interfaces/medication.interface.ts
export interface IMedication {
  id: string;
  userId: string;
  title: string;
  dosage: string;
  notes: string;
  datetimeAt: Date;
  createdAt: Date;
  updateAt: Date;
}
