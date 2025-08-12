import { ISymptom } from '../interfaces/symptom.interface';

const userId = 'seed-user-123';
const now = new Date();

export const symptomSeed: ISymptom[] = [
  {
    id: 'symptom1',
    userId,
    type: 'Confused Thinking',
    severity: 3,
    note: 'Difficulty concentrating',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom2',
    userId,
    type: 'Constipation',
    severity: 2,
    note: 'Digestive issue',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom3',
    userId,
    type: 'Dizziness',
    severity: 4,
    note: 'Feeling lightheaded',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom4',
    userId,
    type: 'Light Sensitivity',
    severity: 6,
    note: 'A symptom of a migraine',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom5',
    userId,
    type: 'Nausea',
    severity: 5,
    note: 'Feeling sick to the stomach',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom6',
    userId,
    type: 'Noise Sensitivity',
    severity: 7,
    note: 'Also a migraine symptom',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom7',
    userId,
    type: 'Smelly',
    severity: 1,
    note: 'Unknown cause',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'symptom8',
    userId,
    type: 'Weather (loud wind)',
    severity: 8,
    note: 'Triggered by weather changes',
    createdAt: now,
    datetimeAt: now,
  },
];
