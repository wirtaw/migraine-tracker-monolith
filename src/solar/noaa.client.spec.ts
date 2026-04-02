import { Test, TestingModule } from '@nestjs/testing';
import { NoaaClient } from './noaa.client';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DateTime } from 'luxon';
import {
  IGeophysicalWeatherData,
  NextWeather,
} from './interfaces/radiation.interface';
import { mockGlobalFetch } from '../../test/helper/fetch-mock';

describe('NoaaClient', () => {
  let service: NoaaClient;
  let module: TestingModule;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  // Helper to generate dynamic mock data based on the provided structure
  const generateMockData = (
    baseDate: DateTime,
    beforeDays: number = -1,
  ): string[][] => {
    const header = ['time_tag', 'Kp', 'a_running', 'station_count'];
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
        data.push([timeStr, kp, aRunning, stationCount]);
      }
    }

    return [header, ...data];
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        NoaaClient,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<NoaaClient>(NoaaClient);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSolarRadiation', () => {
    it('should return cached data if available', async () => {
      const cachedData = [
        { Kp: 2.67, aRunning: 12, date: '2025-11-22 00:00:00.000' },
      ];
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSolarRadiation();

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('solar_radiation_noaa');
    });

    it('should fetch and process data if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api-1');

      const today = DateTime.now();
      const mockData = generateMockData(today);

      mockGlobalFetch({
        ok: true,
        status: 200,
        data: mockData,
      });

      const result = await service.getSolarRadiation();

      expect(result).toBeDefined();

      expect(result).toHaveProperty('kIndex');
      expect(result).toHaveProperty('aIndex');
      expect(result).toHaveProperty('solarFlux');
      expect(result).toHaveProperty('pastWeather');
      expect(result).toHaveProperty('nextWeather');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'solar_radiation_noaa',
        result,
        3600000,
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://noaa-api-1/products/noaa-planetary-k-index.json',
      );
    });

    it('should return undefined on API error', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');
      mockGlobalFetch({
        ok: false,
        status: 500,
        errorMessage: 'Unauthorized',
      });

      const result = await service.getSolarRadiation();

      expect(result).toBeUndefined();
    });

    it('should return undefined if response data is invalid', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api-2');

      mockGlobalFetch({
        ok: true,
        status: 200,
        data: 'invalid-string-data',
      });

      const result = await service.getSolarRadiation();

      expect(result).toBeUndefined();
    });
  });

  describe('getSolarRadiationByDate', () => {
    it('should return cached data if available', async () => {
      mockConfigService.get.mockReturnValue('http://noaa-api-3');
      const isoDate = DateTime.now().minus({ days: 6 }).toISO();
      const cachedData = {
        kIndex: 2.67,
        aIndex: 12,
        solarFlux: 0,
        pastWeather: { level: '' },
        nextWeather: {
          kpIndex: {
            observed: '',
            expected: '',
            rationale: '',
          },
          solarRadiation: {
            rationale: '',
          },
          radioBlackout: {
            rationale: '',
          },
        },
      };
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSolarRadiationByDate(isoDate);

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `solar_geophysical_weather_data_${isoDate}`,
      );
      expect(global.fetch).not.toHaveBeenCalledWith(
        'http://noaa-api-3/products/noaa-planetary-k-index.json',
      );
    });

    it('should fetch and process data if not cached and 6 days ', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api-4');

      const dt = DateTime.now().minus({ days: 6 });
      const mockData = generateMockData(DateTime.now(), -10);

      const data = mockData.filter((item) =>
        item[0].includes(dt.toFormat('yyyy-MM-dd')),
      );

      const expected: IGeophysicalWeatherData = {
        solarFlux: 0,
        aIndex: parseInt(data[data.length - 1][2], 10),
        kIndex: parseFloat(data[data.length - 1][1]),
        pastWeather: { level: '' },
        nextWeather: {
          kpIndex: {
            observed: '',
            expected: '',
            rationale: '',
          },
          solarRadiation: {
            rationale: '',
          },
          radioBlackout: {
            rationale: '',
          },
        },
      };

      mockGlobalFetch({
        ok: true,
        status: 200,
        data: mockData,
      });

      const result = await service.getSolarRadiationByDate(dt.toISO());

      expect(result).toBeDefined();

      expect(result).toHaveProperty('solarFlux');
      expect(result).toHaveProperty('aIndex');
      expect(result).toHaveProperty('kIndex');
      expect(result).toHaveProperty('pastWeather');
      expect(result).toHaveProperty('nextWeather');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `solar_geophysical_weather_data_${dt.toISO()}`,
        expected,
        3600000,
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://noaa-api-4/products/noaa-planetary-k-index.json',
      );
    });

    it('should fetch and process data if not cached and >= 7 days ', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api-5');

      const dt = DateTime.now().minus({ days: 7 });
      const mockData = generateMockData(DateTime.now(), -10);

      mockGlobalFetch({
        ok: true,
        status: 200,
        data: mockData,
      });

      const result = await service.getSolarRadiationByDate(dt.toISO());

      expect(result).toBeDefined();

      expect(result).toHaveProperty('solarFlux');
      expect(result).toHaveProperty('aIndex');
      expect(result).toHaveProperty('kIndex');
      expect(result).toHaveProperty('pastWeather');
      expect(result).toHaveProperty('nextWeather');

      expect(mockCacheManager.set).not.toHaveBeenCalledWith(
        'http://noaa-api-5/products/noaa-planetary-k-index.json',
      );
    });

    it('should return empty data if invalid date', async () => {
      const isoDate = '';
      const expected: IGeophysicalWeatherData = {
        solarFlux: 0,
        aIndex: 0,
        kIndex: 0,
        pastWeather: { level: '' },
        nextWeather: {
          kpIndex: {
            observed: '',
            expected: '',
            rationale: '',
          },
          solarRadiation: {
            rationale: '',
          },
          radioBlackout: {
            rationale: '',
          },
        },
      };
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getSolarRadiationByDate(isoDate);

      expect(result).toEqual(expected);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('processPlanetaryKIndex', () => {
    it('should return undefined for invalid input', () => {
      const dt = DateTime.now();
      expect(service.processPlanetaryKIndex(undefined, dt)).toBeUndefined();
      expect(
        service.processPlanetaryKIndex([] as string[], dt),
      ).toBeUndefined();
    });

    it('should process valid data correctly', () => {
      const dt = DateTime.now();
      const todayStr = dt.toFormat('yyyy-MM-dd');
      const mockData: unknown[] = [
        ['header'],
        [`${todayStr} 00:00:00.000`, '3.00', '15', '8'],
        ['2000-01-01 00:00:00.000', '1.00', '5', '8'], // Different date
      ];

      const result = service.processPlanetaryKIndex(mockData as string[], dt);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        Kp: 3.0,
        aRunning: 15,
        date: `${todayStr} 00:00:00.000`,
      });
    });

    it('should handle parsing errors gracefully', () => {
      const dt = DateTime.now();

      // Malformed data that might cause parsing error if code assumes structure
      // The code does `parseFloat(item[1])` and `parseInt(item[2])`.
      // If item is not an array or too short, it might throw or return NaN.
      // The current implementation has a try-catch block.

      // Let's force an error. The code iterates `for (const item of items)`.
      // If `items` contains something that is not iterable or doesn't have index access as expected if it wasn't an array of arrays (though typescript says string[]).
      // The implementation casts `data as string[]` but treats elements as arrays `item[0]`.

      const mockData: unknown[] = [
        null, // This will cause error when accessing item[0]
      ];

      const result = service.processPlanetaryKIndex(mockData as string[], dt);
      expect(result).toBeUndefined();
    });
  });

  describe('getSolarRadiationForecast', () => {
    let mockData: string = '';

    beforeEach(() => {
      mockData = ` :Product: 3-Day Forecast

:Issued: 2025 Dec 09 1230 UTC

# Prepared by the U.S. Dept. of Commerce, NOAA, Space Weather Prediction Center

#

A. NOAA Geomagnetic Activity Observation and Forecast


The greatest observed 3 hr Kp over the past 24 hours was 2 (below NOAA

Scale levels).

The greatest expected 3 hr Kp for Dec 09-Dec 11 2025 is 6.67 (NOAA Scale

G3).


NOAA Kp index breakdown Dec 09-Dec 11 2025


Dec 09 Dec 10 Dec 11

00-03UT 2.33 5.33 (G1) 2.67

03-06UT 0.67 5.00 (G1) 2.00

06-09UT 1.00 5.00 (G1) 2.33

09-12UT 1.00 4.33 2.33

12-15UT 6.67 (G3) 4.00 2.33

15-18UT 5.33 (G1) 3.67 2.33

18-21UT 5.00 (G1) 3.67 2.33

21-00UT 3.67 1.33 2.67


Rationale: Periods of G2-G3 (Moderate-Strong) geomagnetic storms are

likely on 09 Dec, due to the anticipated influence of a CME from Dec 06.


B. NOAA Solar Radiation Activity Observation and Forecast


Solar radiation, as observed by NOAA GOES-18 over the past 24 hours, was

below S-scale storm level thresholds.


Solar Radiation Storm Forecast for Dec 09-Dec 11 2025


Dec 09 Dec 10 Dec 11

S1 or greater 15% 15% 15%


Rationale: There is a slight chance for S1 (Minor) or greater solar

radiation storms on 09-11 Dec.


C. NOAA Radio Blackout Activity and Forecast


Radio blackouts reaching the R1 levels were observed over the past 24

hours. The largest was at Dec 08 2025 2117 UTC.


Radio Blackout Forecast for Dec 09-Dec 11 2025


Dec 09 Dec 10 Dec 11

R1-R2 65% 65% 65%

R3 or greater 15% 15% 15%


Rationale: R1-R2 (Minor-Moderate) radio blackouts are likely, with a

slight chance for R3 (Strong) or greater events on 09-11 Dec. `;
    });

    it('should return cached data if available', async () => {
      const dt = DateTime.now();
      const cachedData = {
        kpIndex: {
          observed:
            ' The greatest observed 3 hr Kp over the past 24 hours was 2 (below NOAA Scale levels). ',
          expected:
            ' The greatest expected 3 hr Kp for Dec 09-Dec 11 2025 is 6.67 (NOAA Scale G3). ',
          rationale:
            'Periods of G2-G3 (Moderate-Strong) geomagnetic storms are likely on 09 Dec, due to the anticipated influence of a CME from Dec 06',
        },
        solarRadiation: {
          rationale:
            'There is a slight chance for S1 (Minor) or greater solar radiation storms on 09-11 Dec',
        },
        radioBlackout: {
          rationale:
            'R1-R2 (Minor-Moderate) radio blackouts are likely, with a slight chance for R3 (Strong) or greater events on 09-11 Dec',
        },
      };
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getSolarRadiationForecast();

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `solar_geophysical_3_day_forecast_${dt.toISODate()}`,
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and process data if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://noaa-api');

      const dt = DateTime.now();

      const expected: NextWeather = {
        kpIndex: {
          observed:
            'The greatest observed 3 hr Kp over the past 24 hours was 2 (below NOAA Scale levels)',
          expected:
            'The greatest expected 3 hr Kp for Dec 09-Dec 11 2025 is 6.67 (NOAA Scale G3)',
          rationale:
            'Periods of G2-G3 (Moderate-Strong) geomagnetic storms are likely on 09 Dec, due to the anticipated influence of a CME from Dec 06.',
        },
        solarRadiation: {
          rationale:
            'There is a slight chance for S1 (Minor) or greater solar radiation storms on 09-11 Dec.',
        },
        radioBlackout: {
          rationale:
            'R1-R2 (Minor-Moderate) radio blackouts are likely, with a slight chance for R3 (Strong) or greater events on 09-11 Dec.',
        },
      };

      mockGlobalFetch({
        ok: true,
        status: 200,
        data: mockData,
      });

      const result = await service.getSolarRadiationForecast();

      expect(result).toBeDefined();

      expect(result).toHaveProperty('kpIndex');
      expect(result).toHaveProperty('solarRadiation');
      expect(result).toHaveProperty('radioBlackout');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `solar_geophysical_3_day_forecast_${dt.toISODate()}`,
        expected,
        3600000,
      );
    });
  });

  describe('process3DayForecast', () => {
    let mockData: string = '';

    beforeEach(() => {
      mockData = ` :Product: 3-Day Forecast

:Issued: 2025 Dec 09 1230 UTC

# Prepared by the U.S. Dept. of Commerce, NOAA, Space Weather Prediction Center

#

A. NOAA Geomagnetic Activity Observation and Forecast


The greatest observed 3 hr Kp over the past 24 hours was 2 (below NOAA

Scale levels).

The greatest expected 3 hr Kp for Dec 09-Dec 11 2025 is 6.67 (NOAA Scale

G3).


NOAA Kp index breakdown Dec 09-Dec 11 2025


Dec 09 Dec 10 Dec 11

00-03UT 2.33 5.33 (G1) 2.67

03-06UT 0.67 5.00 (G1) 2.00

06-09UT 1.00 5.00 (G1) 2.33

09-12UT 1.00 4.33 2.33

12-15UT 6.67 (G3) 4.00 2.33

15-18UT 5.33 (G1) 3.67 2.33

18-21UT 5.00 (G1) 3.67 2.33

21-00UT 3.67 1.33 2.67


Rationale: Periods of G2-G3 (Moderate-Strong) geomagnetic storms are

likely on 09 Dec, due to the anticipated influence of a CME from Dec 06.


B. NOAA Solar Radiation Activity Observation and Forecast


Solar radiation, as observed by NOAA GOES-18 over the past 24 hours, was

below S-scale storm level thresholds.


Solar Radiation Storm Forecast for Dec 09-Dec 11 2025


Dec 09 Dec 10 Dec 11

S1 or greater 15% 15% 15%


Rationale: There is a slight chance for S1 (Minor) or greater solar

radiation storms on 09-11 Dec.


C. NOAA Radio Blackout Activity and Forecast


Radio blackouts reaching the R1 levels were observed over the past 24

hours. The largest was at Dec 08 2025 2117 UTC.


Radio Blackout Forecast for Dec 09-Dec 11 2025


Dec 09 Dec 10 Dec 11

R1-R2 65% 65% 65%

R3 or greater 15% 15% 15%


Rationale: R1-R2 (Minor-Moderate) radio blackouts are likely, with a

slight chance for R3 (Strong) or greater events on 09-11 Dec. `;
    });

    it('should return undefined for invalid input', () => {
      expect(service.process3DayForecast(undefined)).toBeUndefined();
    });

    it('should process valid data correctly', () => {
      const result = service.process3DayForecast(mockData);

      expect(result).toBeDefined();
      expect(result!).toEqual({
        kpIndex: {
          observed:
            'The greatest observed 3 hr Kp over the past 24 hours was 2 (below NOAA Scale levels)',
          expected:
            'The greatest expected 3 hr Kp for Dec 09-Dec 11 2025 is 6.67 (NOAA Scale G3)',
          rationale:
            'Periods of G2-G3 (Moderate-Strong) geomagnetic storms are likely on 09 Dec, due to the anticipated influence of a CME from Dec 06.',
        },
        solarRadiation: {
          rationale:
            'There is a slight chance for S1 (Minor) or greater solar radiation storms on 09-11 Dec.',
        },
        radioBlackout: {
          rationale:
            'R1-R2 (Minor-Moderate) radio blackouts are likely, with a slight chance for R3 (Strong) or greater events on 09-11 Dec.',
        },
      });
    });

    it('should process data not macth case', () => {
      const result = service.process3DayForecast(`test
A. NOAA Geomagnetic Activity Observation and Forecast

a
b
c

B. NOAA Solar Radiation Activity Observation and Forecast

c
d
f

C. NOAA Radio Blackout Activity and Forecast
        
e
f `);

      expect(result).toBeDefined();
      expect(result!).toEqual({
        kpIndex: {
          observed: 'N/A',
          expected: 'N/A',
          rationale: 'N/A',
        },
        solarRadiation: {
          rationale: 'N/A',
        },
        radioBlackout: {
          rationale: 'N/A',
        },
      });
    });

    it('should process data not contains', () => {
      const result = service.process3DayForecast(`test`);

      expect(result).toBeDefined();
      expect(result!).toEqual({
        kpIndex: {
          observed: 'N/A',
          expected: 'N/A',
          rationale: 'N/A',
        },
        solarRadiation: {
          rationale: 'N/A',
        },
        radioBlackout: {
          rationale: 'N/A',
        },
      });
    });
  });
});
