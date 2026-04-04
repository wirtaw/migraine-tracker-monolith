import {
  INoaaRadiationItem,
  INoaaRadiationResponse,
} from '../interfaces/radiation.interface';
import { DateTime } from 'luxon';

/**
 * Generates a mock response for NOAA Radiation (Kp Index) data.
 * Useful for unit testing services or components that consume space weather data.
 */
export const getMockNoaaRadiationData = (
  todayStr?: string,
): INoaaRadiationResponse => {
  const todayItems = todayStr
    ? [
        {
          time_tag: `${todayStr || '2025-03-28'} 00:00:00.000`,
          Kp: 3.0,
          a_running: 15,
          station_count: 8,
        },
        {
          time_tag: `${todayStr || '2025-03-28'} 03:00:00.000`,
          Kp: 2.67,
          a_running: 12,
          station_count: 8,
        },
        {
          time_tag: `${todayStr || '2025-03-28'} 06:00:00.000`,
          Kp: 2.67,
          a_running: 12,
          station_count: 8,
        },
        {
          time_tag: `${todayStr || '2025-03-28'} 09:00:00.000`,
          Kp: 1.67,
          a_running: 6,
          station_count: 8,
        },
      ]
    : [];

  return {
    data: [
      {
        time_tag: '2025-03-28T00:00:00',
        Kp: 3.33,
        a_running: 18,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T03:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T06:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T09:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T12:00:00',
        Kp: 1.67,
        a_running: 6,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T15:00:00',
        Kp: 1.67,
        a_running: 6,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T18:00:00',
        Kp: 1.33,
        a_running: 5,
        station_count: 8,
      },
      {
        time_tag: '2025-03-28T21:00:00',
        Kp: 3.33,
        a_running: 18,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T00:00:00',
        Kp: 3.67,
        a_running: 22,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T03:00:00',
        Kp: 3.67,
        a_running: 22,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T06:00:00',
        Kp: 3.33,
        a_running: 18,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T09:00:00',
        Kp: 2.33,
        a_running: 9,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T12:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T15:00:00',
        Kp: 3.33,
        a_running: 18,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T18:00:00',
        Kp: 1,
        a_running: 4,
        station_count: 8,
      },
      {
        time_tag: '2025-03-29T21:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T00:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T03:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T06:00:00',
        Kp: 3.33,
        a_running: 18,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T09:00:00',
        Kp: 3,
        a_running: 15,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T12:00:00',
        Kp: 3,
        a_running: 15,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T15:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T18:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-30T21:00:00',
        Kp: 1.67,
        a_running: 6,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T00:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T03:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T06:00:00',
        Kp: 2.33,
        a_running: 9,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T09:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T12:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T15:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-03-31T18:00:00',
        Kp: 0.67,
        a_running: 3,
        station_count: 4,
      },
      {
        time_tag: '2025-03-31T21:00:00',
        Kp: 1.33,
        a_running: 5,
        station_count: 4,
      },
      {
        time_tag: '2025-04-01T00:00:00',
        Kp: 3,
        a_running: 15,
        station_count: 4,
      },
      {
        time_tag: '2025-04-01T03:00:00',
        Kp: 1.33,
        a_running: 5,
        station_count: 8,
      },
      {
        time_tag: '2025-04-01T06:00:00',
        Kp: 1.33,
        a_running: 5,
        station_count: 8,
      },
      {
        time_tag: '2025-04-01T09:00:00',
        Kp: 1.67,
        a_running: 6,
        station_count: 8,
      },
      {
        time_tag: '2025-04-01T12:00:00',
        Kp: 3,
        a_running: 15,
        station_count: 8,
      },
      {
        time_tag: '2025-04-01T15:00:00',
        Kp: 2,
        a_running: 7,
        station_count: 8,
      },
      {
        time_tag: '2025-04-01T18:00:00',
        Kp: 1.67,
        a_running: 6,
        station_count: 8,
      },
      {
        time_tag: '2025-04-01T21:00:00',
        Kp: 2.33,
        a_running: 9,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T00:00:00',
        Kp: 4.67,
        a_running: 39,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T03:00:00',
        Kp: 4,
        a_running: 27,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T06:00:00',
        Kp: 5.33,
        a_running: 56,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T09:00:00',
        Kp: 5,
        a_running: 48,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T12:00:00',
        Kp: 5,
        a_running: 48,
        station_count: 7,
      },
      {
        time_tag: '2025-04-02T15:00:00',
        Kp: 5.67,
        a_running: 67,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T18:00:00',
        Kp: 4.67,
        a_running: 39,
        station_count: 8,
      },
      {
        time_tag: '2025-04-02T21:00:00',
        Kp: 3.67,
        a_running: 22,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T00:00:00',
        Kp: 4,
        a_running: 27,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T03:00:00',
        Kp: 3.67,
        a_running: 22,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T06:00:00',
        Kp: 5,
        a_running: 48,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T09:00:00',
        Kp: 4,
        a_running: 27,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T12:00:00',
        Kp: 3.67,
        a_running: 22,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T15:00:00',
        Kp: 6.67,
        a_running: 111,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T18:00:00',
        Kp: 5.67,
        a_running: 67,
        station_count: 8,
      },
      {
        time_tag: '2025-04-03T21:00:00',
        Kp: 5.67,
        a_running: 67,
        station_count: 8,
      },
      {
        time_tag: '2025-04-04T00:00:00',
        Kp: 4.67,
        a_running: 39,
        station_count: 8,
      },
      {
        time_tag: '2025-04-04T03:00:00',
        Kp: 3.67,
        a_running: 22,
        station_count: 8,
      },
      {
        time_tag: '2025-04-04T06:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      {
        time_tag: '2025-04-04T09:00:00',
        Kp: 2.67,
        a_running: 12,
        station_count: 8,
      },
      ...todayItems,
    ],
  };
};

export const generateMockData = (
  baseDate: DateTime,
  beforeDays: number = -1,
): INoaaRadiationItem[] => {
  const data = [];

  // Generate data for 3 days: yesterday, today, tomorrow
  for (let i = beforeDays; i <= 1; i++) {
    const date = baseDate.plus({ days: i });
    const dateStr = date.toFormat('yyyy-MM-dd');

    // 8 entries per day (every 3 hours)
    for (let j = 0; j < 24; j += 3) {
      const timeStr = `${dateStr} ${j.toString().padStart(2, '0')}:00:00.000`;
      // Mock values similar to the example
      const kp = (1 + Math.random() * 4).toFixed(2);
      const aRunning = Math.floor(Math.random() * 20).toString();
      const stationCount = '8';
      data.push({
        time_tag: timeStr,
        Kp: parseFloat(kp),
        a_running: parseInt(aRunning),
        station_count: parseInt(stationCount),
      });
    }
  }

  return data;
};
