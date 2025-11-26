import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IPlanetaryKindexDataItem } from './interfaces/radiation.interface';
import { DateTime } from 'luxon';

@Injectable()
export class NoaaClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  processPlanetaryKIndex = (
    items: string[] | undefined,
    dt: DateTime,
  ): IPlanetaryKindexDataItem[] | undefined => {
    if (!items || !Array.isArray(items) || !items.length) {
      return undefined;
    }

    try {
      const result = [];

      for (const item of items) {
        if (item[0].includes(dt.toFormat('yyyy-MM-dd'))) {
          result.push({
            Kp: parseFloat(item[1]),
            aRunning: parseInt(item[2], 10),
            date: item[0],
          });
        }
      }

      return result;
    } catch (error) {
      Logger.error('Error parsing data:', error);
      return undefined;
    }
  };

  async getSolarRadiation(): Promise<IPlanetaryKindexDataItem[] | undefined> {
    const cacheKey = `solar_radiation_noaa`;
    const cached =
      await this.cacheManager.get<IPlanetaryKindexDataItem[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const baseUrl = this.config.get<string>('integration.apis.noaa');
    const url = `${baseUrl}/products/noaa-planetary-k-index.json`;

    try {
      const response = await firstValueFrom(this.http.get(url));
      const data = response.data as string[] | undefined;
      const dt = DateTime.now();
      const processedData = this.processPlanetaryKIndex(data, dt);
      if (processedData) {
        await this.cacheManager.set(cacheKey, processedData, 3600000);
      }
      return processedData;
    } catch (error) {
      Logger.error('Error fetching NOAA data', error);
      return undefined;
    }
  }
}
