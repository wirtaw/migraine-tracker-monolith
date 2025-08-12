import { IMedication } from '../interfaces/medication.interface';

const userId = 'seed-user-123';
const now = new Date();

export const medicationSeed: IMedication[] = [
  {
    id: '1',
    userId,
    title: 'Aspirin',
    dosage: '10mg',
    notes: 'Common pain reliever',
    createdAt: now,
    updateAt: now,
    datetimeAt: now,
  },
  {
    id: '2',
    userId,
    title: 'Ibuprofen',
    dosage: '10mg',
    notes: 'Used for inflammation',
    createdAt: now,
    updateAt: now,
    datetimeAt: now,
  },
  {
    id: '3',
    userId,
    title: 'Paracetamol',
    dosage: '10mg',
    notes: 'Fever reducer',
    createdAt: now,
    updateAt: now,
    datetimeAt: now,
  },
  {
    id: '4',
    userId,
    title: 'Amoxicillin',
    dosage: '10mg',
    notes: 'Antibiotic',
    createdAt: now,
    updateAt: now,
    datetimeAt: now,
  },
  {
    id: '5',
    userId,
    title: 'Metformin',
    dosage: '10mg',
    notes: 'Diabetes medication',
    createdAt: now,
    updateAt: now,
    datetimeAt: now,
  },
];
