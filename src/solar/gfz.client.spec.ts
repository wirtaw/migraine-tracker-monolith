/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GfzClient } from './gfz.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DateTime } from 'luxon';
import { IKPIData } from './interfaces/radiation.interface';
import { GFZ_LINE_REGEX } from '../weather/weather.constants';

const KP_TO_AP_MAP: Record<number, number> = {
  0: 0,
  1: 3,
  2: 7,
  3: 15,
  4: 27,
  5: 48,
  6: 80,
  7: 132,
  8: 207,
  9: 400,
};

const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const pad = (
  val: string | number,
  width: number,
  precision?: number,
): string => {
  const strVal =
    typeof val === 'number' && precision !== undefined
      ? val.toFixed(precision)
      : String(val);

  return strVal.padStart(width, ' ');
};

const calculateAp = (kp: number): number => {
  const roundedKp = Math.round(kp);
  return KP_TO_AP_MAP[roundedKp] || 0;
};

function generateMockSolarFlux(
  currentDate: DateTime,
  startBsr: number = 2621,
  startDays: number = 34270,
): string {
  const header = `#YYY MM DD  days  days_m  Bsr dB    Kp1    Kp2    Kp3    Kp4    Kp5    Kp6    Kp7    Kp8  ap1  ap2  ap3  ap4  ap5  ap6  ap7  ap8    Ap  SN F10.7obs F10.7adj D`;

  const rows: string[] = [header];
  const today = DateTime.now().endOf('day');
  const now = DateTime.now();

  let daysCounter = startDays;
  let bsrCounter = startBsr;
  let dbCounter = 1;

  while (currentDate <= today) {
    const kps: number[] = [];
    const aps: number[] = [];
    const isToday = currentDate.hasSame(now, 'day');
    const currentInterval = Math.floor(now.hour / 3);

    for (let i = 0; i < 8; i++) {
      if (isToday && i > currentInterval) {
        kps.push(-1.0);
        aps.push(-1);
      } else {
        const rawStep = Math.floor(randomRange(0, 20));
        const kpVal = rawStep / 3;
        kps.push(kpVal);
        aps.push(calculateAp(kpVal));
      }
    }

    const validAps = aps.filter((ap) => ap !== -1);
    const dailyAp =
      validAps.length > 0
        ? Math.round(validAps.reduce((a, b) => a + b, 0) / validAps.length)
        : -1;

    let f10_obs = -1.0;
    let f10_adj = -1.0;
    let sn = -1;

    if (!isToday) {
      f10_obs = randomRange(100, 180);
      f10_adj = f10_obs * 0.98;
      sn = Math.round((f10_obs - 60) * 1.5);
    }

    const yyy = currentDate.year;
    const mm = pad(currentDate.month, 2, 0).replace(' ', '0');
    const dd = pad(currentDate.day, 2, 0).replace(' ', '0');

    const parts = [
      yyy,
      pad(mm, 2),
      pad(dd, 2),
      pad(daysCounter, 5),
      pad(daysCounter + 0.5, 7, 1),
      pad(bsrCounter, 4),
      pad(dbCounter, 2),
      ...kps.map((k) => pad(k, 6, 3)),
      ...aps.map((a) => pad(a, 4)),
      pad(dailyAp, 5),
      pad(sn, 3),
      pad(f10_obs, 8, 1),
      pad(f10_adj, 8, 1),
      ' 0',
    ];

    rows.push(parts.join(' '));

    currentDate = currentDate.plus({ days: 1 });
    daysCounter++;

    dbCounter++;
    if (dbCounter > 27) {
      dbCounter = 1;
      bsrCounter++;
    }
  }

  return rows.join('\n');
}

describe('GfzClient', () => {
  let client: GfzClient;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.gfz-potsdam.de'),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockGfzData = (currentDate: DateTime): string => {
    return `# PURPOSE: This file distributes the geomagnetic planetary three-hour index Kp and associated geomagnetic indices as well as relevant solar indices.
# LICENSE: CC BY 4.0, except for the sunspot numbers contained in this file, which have the CC BY-NC 4.0 license
# SOURCE: Geomagnetic Observatory Niemegk, GFZ Helmholtz Centre for Geosciences
# PLEASE CITE: Matzka, J., Stolle, C., Yamazaki, Y., Bronkalla, O. and Morschhauser, A., 2021. The geomagnetic Kp index 
# and derived indices of geomagnetic activity. Space Weather, https://doi.org/10.1029/2020SW002641
#
# Kp, ap and Ap
# The three-hourly equivalent planetary amplitude ap is derived from Kp and the daily equivalent planetary amplitude Ap is the daily mean of ap.
# Kp is unitless. Ap and ap are unitless and can be multiplied by 2 nT to yield the average geomagnetic disturbance at 50 degree geomagnetic latitude.
# Kp, ap and Ap were introduced by Bartels (1949, 1957) and are produced by Geomagnetic Observatory Niemegk, GFZ Helmholtz Centre for Geosciences.
# Described in: Matzka et al. (2021), see reference above.
# Data publication: Matzka, J., Bronkalla, O., Tornow, K., Elger, K. and Stolle, C., 2021. Geomagnetic Kp index. V. 1.0. GFZ Data Services, 
# https://doi.org/10.5880/Kp.0001
# Note: the most recent values are nowcast values and will be replaced by definitive values as soon as they become available.
# 
# International Sunspot Number SN
# The international sunspot number SN (written with subscript N) is given as the daily total sunspot number version 2.0 introduced in 2015.
# The sunspot data is available under the licence CC BY-NC 4.0 from WDC-SILSO, Royal Observatory of Belgium, Brussels. Described in:
# Clette, F., Lefevre, L., 2016. The New Sunspot Number: assembling all corrections. Solar Physics, 291, https://doi.org/10.1007/s11207-016-1014-y 
# Note: the most recent values are preliminary and replaced by definitive values as soon as they become available.
#
# F10.7 Solar Radio Flux
# Local noon-time observed (F10.7obs) and adjusted (F10.7adj) solar radio flux F10.7 in s.f.u. (10^-22 W m^-2 Hz^-1) is provided by 
# Dominion Radio Astrophysical Observatory and Natural Resources Canada.
# Described in: Tapping, K.F., 2013. The 10.7 cm solar radio flux (F10.7). Space Weather, 11, 394-406, https://doi.org/10.1002/swe.20064 
# Note: For ionospheric and atmospheric studies the use of F10.7obs is recommended.
# 
# Short file description (for a detailed file description, see Kp_ap_Ap_SN_F107_format.txt):
# 40 header lines, all starting with #
# ASCII, blank separated and fixed length, missing data indicated by -1.000 for Kp, -1 for ap and SN, -1.0 for F10.7
# YYYY MM DD is date of UT day, days is days since 1932-01-01 00:00 UT to start of UT day, days_m is days since 1932-01-01 00:00 UT to midday of UT day
# BSR is Bartels solar rotation number, dB is day within BSR 
# Kp1 to Kp8 (Kp for the eight eighth of the UT day), ap1 to ap8 (ap for the eight eighth of the UT day), Ap, SN, F10.7obs, F10.7adj
# D indicates if the Kp and SN values are definitive or preliminary. D=0: Kp and SN preliminary; D=1: Kp definitive, SN preliminary; D=2 Kp and SN definitive
#
#
# The format for each line is (i stands for integer, f for float):
#iii ii ii iiiii fffff.f iiii ii ff.fff ff.fff ff.fff ff.fff ff.fff ff.fff ff.fff ff.fff iiii iiii iiii iiii iiii iiii iiii iiii  iiii iii ffffff.f ffffff.f i
# The parameters in each line are:
${generateMockSolarFlux(currentDate)}`;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GfzClient,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    client = module.get<GfzClient>(GfzClient);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('getKpIndex', () => {
    it('should fetch Kp index data', async () => {
      const mockData = mockGfzData(DateTime.now().minus({ days: 7 }));
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as unknown as AxiosHeaders },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await client.getKpIndex();

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.gfz-potsdam.de/kp_index/Kp_ap_Ap_SN_F107_nowcast.txt',
      );
      expect(result).toBeDefined();
      expect(Object.keys(result as IKPIData)).toEqual([
        'AP',
        'D',
        'Kp1',
        'Kp2',
        'Kp3',
        'Kp4',
        'Kp5',
        'Kp6',
        'Kp7',
        'Kp8',
        'ap1',
        'ap2',
        'ap3',
        'ap4',
        'ap5',
        'ap6',
        'ap7',
        'ap8',
        'date',
        'solarFlux',
        'sunsPotNumber',
      ]);
    });

    it('should return cached Kp index data if available', async () => {
      const cachedKPIData: IKPIData = {
        AP: 1,
        D: 1,
        Kp1: 1,
        Kp2: 1,
        Kp3: 1,
        Kp4: 1,
        Kp5: 1,
        Kp6: 1,
        Kp7: 1,
        Kp8: 1,
        ap1: 1,
        ap2: 1,
        ap3: 1,
        ap4: 1,
        ap5: 1,
        ap6: 1,
        ap7: 1,
        ap8: 1,
        date: 'd',
        solarFlux: 1,
        sunsPotNumber: 1,
      };
      mockCacheManager.get.mockResolvedValue(cachedKPIData);

      const result = await client.getKpIndex();

      expect(result).toBeDefined();
      expect(Object.keys(result as IKPIData)).toEqual([
        'AP',
        'D',
        'Kp1',
        'Kp2',
        'Kp3',
        'Kp4',
        'Kp5',
        'Kp6',
        'Kp7',
        'Kp8',
        'ap1',
        'ap2',
        'ap3',
        'ap4',
        'ap5',
        'ap6',
        'ap7',
        'ap8',
        'date',
        'solarFlux',
        'sunsPotNumber',
      ]);
      expect(mockCacheManager.get).toHaveBeenCalledWith('kp_index_gfz');
    });

    it('should return undefined if not get today date', async () => {
      const mockData = mockGfzData(DateTime.now().plus({ days: 1 }));
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as unknown as AxiosHeaders },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await client.getKpIndex();

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.gfz-potsdam.de/kp_index/Kp_ap_Ap_SN_F107_nowcast.txt',
      );
      expect(result).toBeUndefined();
    });

    it('should undefined data if GFZ return undefined', async () => {
      const mockResponse: AxiosResponse = {
        data: undefined,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as unknown as AxiosHeaders },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockCacheManager.get.mockResolvedValue(null);

      const result = await client.getKpIndex();

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.gfz-potsdam.de/kp_index/Kp_ap_Ap_SN_F107_nowcast.txt',
      );
      expect(result).toBeUndefined();
    });

    it('should return null on error', async () => {
      mockHttpService.get.mockImplementation(() => {
        throw new Error('API Error');
      });
      mockCacheManager.get.mockResolvedValue(null);

      const result = await client.getKpIndex();

      expect(result).toBeUndefined();
    });
  });

  describe('processKPI', () => {
    it('should parse valid KPI data correctly', () => {
      const dt = DateTime.fromObject({ year: 2023, month: 10, day: 26 });
      const validLine =
        '2023 10 26 33536 33536.500000 2621  1  1.000  2.000  3.000  4.000  5.000  6.000  7.000  8.000    3    7   15   27   48   80  132  207   65  50  150.0  145.0 0';
      // Note: The regex expects specific decimal places for Kp values (3 decimals) and specific format.
      // Let's match the regex requirements:
      // Kp values: \d+\.\d{3}
      // ap values: \d+
      // Ap: \d+
      // SN: \d+
      // F10.7: \d+\.\d
      // D: \d+

      const result = client.processKPI(validLine, dt);

      expect(result).toBeDefined();
      expect(result?.AP).toBe(65); // match[24]
      expect(result?.D).toBe(0); // match[28]
      expect(result?.Kp1).toBe(1.0);
      expect(result?.Kp8).toBe(8.0);
      expect(result?.ap1).toBe(3);
      expect(result?.ap8).toBe(207);
      expect(result?.sunsPotNumber).toBe(50);
      expect(result?.solarFlux).toBe(150.0);
    });

    it('should return undefined for mismatched date', () => {
      const dt = DateTime.fromObject({ year: 2023, month: 10, day: 27 }); // Different date
      const validLine =
        '2023 10 26 33536 33536.500000 2621  1  1.000  2.000  3.000  4.000  5.000  6.000  7.000  8.000    3    7   15   27   48   80  132  207   65  50  150.0  145.0 0';

      const result = client.processKPI(validLine, dt);

      expect(result).toBeUndefined();
    });

    it('should return undefined for malformed data', () => {
      const dt = DateTime.fromObject({ year: 2023, month: 10, day: 26 });
      const invalidLine = '2023 10 26 invalid data structure';

      const result = client.processKPI(invalidLine, dt);

      expect(result).toBeUndefined();
    });

    it('should return undefined if data is undefined', () => {
      const dt = DateTime.now();
      const result = client.processKPI(undefined, dt);
      expect(result).toBeUndefined();
    });

    it('should handle future intervals with -1 values for today', () => {
      const dt = DateTime.now();
      const currentInterval = Math.floor(dt.hour / 3);
      const mockData = mockGfzData(dt);
      const lines = mockData.split('\n');
      const todayLine = lines.find(
        (l) =>
          l.startsWith(dt.toFormat('yyyy MM dd')) && GFZ_LINE_REGEX.test(l),
      );

      expect(todayLine).toBeDefined();

      const result = client.processKPI(mockData, dt);
      expect(result).toBeDefined();

      if (result) {
        // Check Kp values
        const kpValues = [
          result.Kp1,
          result.Kp2,
          result.Kp3,
          result.Kp4,
          result.Kp5,
          result.Kp6,
          result.Kp7,
          result.Kp8,
        ];

        // Check ap values
        const apValues = [
          result.ap1,
          result.ap2,
          result.ap3,
          result.ap4,
          result.ap5,
          result.ap6,
          result.ap7,
          result.ap8,
        ];

        for (let i = 0; i < 8; i++) {
          if (i > currentInterval) {
            expect(kpValues[i]).toBe(-1.0);
            expect(apValues[i]).toBe(-1);
          } else {
            expect(kpValues[i]).not.toBe(-1.0);
            expect(apValues[i]).not.toBe(-1);
          }
        }
      }
    });
  });
});
