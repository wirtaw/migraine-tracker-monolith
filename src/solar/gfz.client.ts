import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DateTime } from 'luxon';
import { IKPIData } from './interfaces/radiation.interface';

import { GFZ_LINE_REGEX } from '../weather/weather.constants';

@Injectable()
export class GfzClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  processKPI(data: string | undefined, dt: DateTime): IKPIData | undefined {
    if (!data) {
      return undefined;
    }

    const dateStr = dt.toFormat('yyyy MM dd');
    //Logger.log(`date ${dateStr}`);

    const lines = data.split('\n');
    const line = lines.find(
      (l) => l.startsWith(dateStr) && GFZ_LINE_REGEX.test(l),
    );

    if (line) {
      //Logger.log(`matches`, { line });
      const match = line.match(GFZ_LINE_REGEX) as string[];
      return {
        AP: parseInt(match[24], 10),
        D: parseInt(match[28], 10),
        Kp1: parseFloat(match[8]),
        Kp2: parseFloat(match[9]),
        Kp3: parseFloat(match[10]),
        Kp4: parseFloat(match[11]),
        Kp5: parseFloat(match[12]),
        Kp6: parseFloat(match[13]),
        Kp7: parseFloat(match[14]),
        Kp8: parseFloat(match[15]),
        ap1: parseInt(match[16], 10),
        ap2: parseInt(match[17], 10),
        ap3: parseInt(match[18], 10),
        ap4: parseInt(match[19], 10),
        ap5: parseInt(match[20], 10),
        ap6: parseInt(match[21], 10),
        ap7: parseInt(match[22], 10),
        ap8: parseInt(match[23], 10),
        date: dateStr,
        solarFlux: parseFloat(match[26]),
        sunsPotNumber: parseInt(match[25], 10),
      };
    }

    return undefined;
  }

  async getKpIndex(): Promise<IKPIData | undefined> {
    return this.getKpData(DateTime.now());
  }

  async getKpData(date: DateTime): Promise<IKPIData | undefined> {
    const diffDays = date.diffNow('days').days;
    // If date is within last 7 days or in future, use nowcast, else use historical
    const isRecent = diffDays > -7;
    const type = isRecent ? 'nowcast' : 'history';
    const dateStr = date.toFormat('yyyy-MM-dd');

    const cacheKey = `kp_index_gfz_${type}_${dateStr}`;
    const cached = await this.cacheManager.get<IKPIData | undefined>(cacheKey);
    if (cached) {
      return cached;
    }

    const baseUrl = this.config.get<string>('integration.apis.gfz');
    const endpoint = isRecent
      ? 'Kp_ap_Ap_SN_F107_nowcast.txt'
      : 'Kp_ap_Ap_SN_F107_since_1932.txt';

    const url = `${baseUrl}/kp_index/${endpoint}`;

    try {
      const response = await firstValueFrom(this.http.get(url));
      const data = response.data as string | undefined;
      const processedData = this.processKPI(data, date);

      if (processedData) {
        // Cache for 1 hour
        await this.cacheManager.set(cacheKey, processedData, 3600000);
      }
      return processedData;
    } catch (error) {
      Logger.error(`Error fetching GFZ data from ${url}`, error);
      return undefined;
    }
  }
}
