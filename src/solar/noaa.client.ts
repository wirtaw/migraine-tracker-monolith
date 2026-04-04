import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  IPlanetaryKindexDataItem,
  IGeophysicalWeatherData,
  NextWeather,
  INoaaRadiationResponse,
} from './interfaces/radiation.interface';
import { DateTime } from 'luxon';

@Injectable()
export class NoaaClient {
  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  processPlanetaryKIndex = (
    items: INoaaRadiationResponse | undefined,
    dt: DateTime,
  ): IPlanetaryKindexDataItem[] | undefined => {
    if (!items || !Array.isArray(items) || !items.length) {
      return undefined;
    }

    try {
      const result = [];
      const currentDateStr = dt.toFormat('yyyy-MM-dd');
      const found = items.filter(({ time_tag }) =>
        (time_tag as string).includes(currentDateStr),
      );

      if (!found) {
        Logger.warn(
          `No data found for date ${currentDateStr} in planetary K-index response.`,
        );
        return undefined;
      }

      for (const item of found) {
        result.push({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          Kp: item.Kp,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          aRunning: item.a_running,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          date: item.time_tag,
        } as IPlanetaryKindexDataItem);
      }

      Logger.debug('Processing planetary K-index data for date:', {
        date: dt.toISODate(),
        result,
      });

      return result;
    } catch (error) {
      Logger.error('Error parsing data:', error);
      return undefined;
    }
  };

  cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  process3DayForecast(reportText: string | undefined): NextWeather | undefined {
    if (!reportText) return undefined;
    const sectionAMatch = reportText.match(
      /A\. NOAA Geomagnetic([\s\S]*?)(?=B\. NOAA|$)/,
    );
    const sectionBMatch = reportText.match(
      /B\. NOAA Solar Radiation([\s\S]*?)(?=C\. NOAA|$)/,
    );
    const sectionCMatch = reportText.match(
      /C\. NOAA Radio Blackout([\s\S]*?)(?=$)/,
    );

    const partA = sectionAMatch ? sectionAMatch[1] : '';
    const partB = sectionBMatch ? sectionBMatch[1] : '';
    const partC = sectionCMatch ? sectionCMatch[1] : '';

    const kpObservedRegex = /greatest observed 3 hr \s*([\s\S]*?)(?=\.\n|$)/i;

    const kpExpectedRegex = /greatest expected 3 hr \s*([\s\S]*?)(?=\.\n|$)/i;

    const rationaleRegex = /Rationale:\s*([\s\S]*?)(?=\.\r|$)/i;

    const kpObservedMatch = partA.match(kpObservedRegex);
    const kpExpectedMatch = partA.match(kpExpectedRegex);
    const kpRationaleMatch = partA.match(rationaleRegex);

    const solarRationaleMatch = partB.match(rationaleRegex);
    const radioRationaleMatch = partC.match(rationaleRegex);

    return {
      kpIndex: {
        observed: kpObservedMatch
          ? this.cleanText(`The greatest observed 3 hr ${kpObservedMatch[1]}`)
          : 'N/A',
        expected: kpExpectedMatch
          ? this.cleanText(`The greatest expected 3 hr ${kpExpectedMatch[1]}`)
          : 'N/A',
        rationale: kpRationaleMatch
          ? this.cleanText(kpRationaleMatch[1])
          : 'N/A',
      },
      solarRadiation: {
        rationale: solarRationaleMatch
          ? this.cleanText(solarRationaleMatch[1])
          : 'N/A',
      },
      radioBlackout: {
        rationale: radioRationaleMatch
          ? this.cleanText(radioRationaleMatch[1])
          : 'N/A',
      },
    };
  }

  async getSolarRadiation(): Promise<IGeophysicalWeatherData | undefined> {
    const cacheKey = `solar_radiation_noaa`;
    const cached =
      await this.cacheManager.get<IGeophysicalWeatherData>(cacheKey);
    if (cached) {
      Logger.debug('Returning cached NOAA geophysical weather data', {
        cacheKey,
      });
      return cached;
    }
    const baseUrl = this.config.get<string>('integration.apis.noaa');
    const url = `${baseUrl}/products/noaa-planetary-k-index.json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as
        | INoaaRadiationResponse
        | undefined;
      const dt = DateTime.now();
      const processedData = this.processPlanetaryKIndex(data, dt);
      if (processedData) {
        const result: IGeophysicalWeatherData = {
          solarFlux: 0,
          aIndex: processedData[processedData.length - 1].aRunning,
          kIndex: processedData[processedData.length - 1].Kp,
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

    if (!dt.isValid) {
      return emptyData;
    }
    const cacheKey = `solar_geophysical_weather_data_${isoDate}`;
    const cached =
      await this.cacheManager.get<IGeophysicalWeatherData>(cacheKey);
    if (cached) {
      Logger.debug('Returning cached NOAA geophysical weather data for date:', {
        cacheKey,
      });
      return cached;
    }

    const diffDays = dt.diffNow('days');

    if (diffDays.days > -7) {
      const baseUrl = this.config.get<string>('integration.apis.noaa');
      const url = `${baseUrl}/products/noaa-planetary-k-index.json`;
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as
          | INoaaRadiationResponse
          | undefined;
        const processedData = this.processPlanetaryKIndex(data, dt);
        if (processedData) {
          const result: IGeophysicalWeatherData = {
            solarFlux: 0,
            aIndex: processedData[processedData.length - 1].aRunning,
            kIndex: processedData[processedData.length - 1].Kp,
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

  async getSolarRadiationForecast(): Promise<NextWeather | undefined> {
    const dt = DateTime.now();
    const cacheKey = `solar_geophysical_3_day_forecast_${dt.toISODate()}`;
    const cached = await this.cacheManager.get<NextWeather>(cacheKey);
    if (cached) {
      return cached;
    }

    const baseUrl = this.config.get<string>('integration.apis.noaa');
    const url = `${baseUrl}/text/3-day-forecast.txt`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.text()) as string | undefined;
      const result = this.process3DayForecast(data);
      if (result) {
        await this.cacheManager.set(cacheKey, result, 3600000);

        return result;
      }
      return undefined;
    } catch (error) {
      Logger.error('Error fetching NOAA data', error);
      return undefined;
    }
  }
}
