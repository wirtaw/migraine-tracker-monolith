import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  IPlanetaryKindexDataItem,
  IGeophysicalWeatherData,
} from './interfaces/radiation.interface';
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

  async getSolarRadiation(): Promise<IGeophysicalWeatherData | undefined> {
    const cacheKey = `solar_radiation_noaa`;
    const cached =
      await this.cacheManager.get<IGeophysicalWeatherData>(cacheKey);
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
        const result: IGeophysicalWeatherData = {
          solarFlux: 0,
          aIndex: processedData[processedData.length - 1].aRunning,
          kIndex: processedData[processedData.length - 1].Kp,
          pastWeather: { level: '' },
          nextWeather: { level: '' },
        };

        await this.cacheManager.set(cacheKey, result, 3600000);

        return result;
      }
      return undefined;
    } catch (error) {
      Logger.error('Error fetching NOAA data', error);
      return undefined;
    }
  }

  async getSolarRadiationByDate(
    isoDate: string,
  ): Promise<IGeophysicalWeatherData> {
    const dt = DateTime.fromISO(isoDate);
    const emptyData: IGeophysicalWeatherData = {
      solarFlux: 0,
      aIndex: 0,
      kIndex: 0,
      pastWeather: { level: '' },
      nextWeather: { level: '' },
    };

    if (!dt.isValid) {
      return emptyData;
    }
    const cacheKey = `solar_geophysical_weather_data_${isoDate}`;
    const cached =
      await this.cacheManager.get<IGeophysicalWeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    const diffDays = dt.diffNow('days');

    if (diffDays.days > -7) {
      const baseUrl = this.config.get<string>('integration.apis.noaa');
      const url = `${baseUrl}/products/noaa-planetary-k-index.json`;
      try {
        const response = await firstValueFrom(this.http.get(url));
        const data = response.data as string[] | undefined;
        const processedData = this.processPlanetaryKIndex(data, dt);
        if (processedData) {
          const result: IGeophysicalWeatherData = {
            solarFlux: 0,
            aIndex: processedData[processedData.length - 1].aRunning,
            kIndex: processedData[processedData.length - 1].Kp,
            pastWeather: { level: '' },
            nextWeather: { level: '' },
          };
          await this.cacheManager.set(cacheKey, result, 3600000);

          return result;
        }
        return emptyData;
      } catch (error) {
        Logger.error('Error fetching NOAA data', error);
        return emptyData;
      }
    }

    return emptyData;
  }
}
