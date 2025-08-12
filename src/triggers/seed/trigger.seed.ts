import { ITrigger } from '../interfaces/trigger.interface';

const userId = 'seed-user-123';
const now = new Date();

export const triggerSeed: ITrigger[] = [
  {
    id: 'trigger1',
    userId,
    type: 'Stress',
    note: 'Work-related stress',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'trigger2',
    userId,
    type: 'Lack of Sleep',
    note: 'Slept less than 6 hours',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'trigger3',
    userId,
    type: 'Food',
    note: 'A specific type of food',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'trigger4',
    userId,
    type: 'Weather',
    note: 'Barometric pressure changes',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'trigger5',
    userId,
    type: 'Exercise',
    note: 'Intense physical activity',
    createdAt: now,
    datetimeAt: now,
  },
  {
    id: 'trigger6',
    userId,
    type: 'Medication',
    note: 'Side effect of a new medication',
    createdAt: now,
    datetimeAt: now,
  },
];
