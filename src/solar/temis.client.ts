import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IStation, IRadiationData } from './interfaces/radiation.interface';
import { DateTime } from 'luxon';
import haversine from 'haversine';
import * as cheerio from 'cheerio';

const parseValue = (item: string): number => {
  if (Number.isNaN(parseFloat(item))) {
    return 0;
  }

  return parseFloat(item);
};

@Injectable()
export class TemisClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getStations(): Promise<IStation[]> {
    const cacheKey = `stations_temis`;
    const cached = await this.cacheManager.get<IStation[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const baseUrl = this.config.get<string>('integration.apis.temis');

    const response = await firstValueFrom(
      this.http.get(`${baseUrl}/UVarchive/stations_uv.php`),
    );

    const data = response.data as string | undefined;

    if (!data) {
      return [];
    }

    const $ = cheerio.load(data);
    const stations: IStation[] = [];

    $('table tr').each((index, element) => {
      if (index > 0) {
        const title = $(element).find('td:nth-child(1)').text().trim();
        const url = $(element).find('td:nth-child(1) a').attr('href') || '';
        const longitude = parseValue($(element).find('td:nth-child(2)').text());
        const latitude = parseValue($(element).find('td:nth-child(3)').text());
        stations.push({ title, url, latitude, longitude });
      }
    });

    await this.cacheManager.set(cacheKey, stations, 3600000);
    return stations;
  }

  async getClosestStation(lat: number, lon: number): Promise<IStation | null> {
    const stations: IStation[] = await this.getStations();

    let closestStation: IStation | null = null;
    let minDistance = Infinity;

    for (const station of stations) {
      const distance = haversine(
        { latitude: lat, longitude: lon },
        { latitude: station.latitude, longitude: station.longitude },
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = station;
      }
    }

    return closestStation;
  }

  async transform(
    data: string | undefined,
    date: string,
    url: string,
  ): Promise<IRadiationData | undefined> {
    if (!data) {
      return undefined;
    }
    const cacheKey = `${url}-${date}`;
    const cached = await this.cacheManager.get<IRadiationData>(cacheKey);
    if (cached) {
      return cached;
    }
    const lines = data.split('\n');

    for (const line of lines) {
      if (line.startsWith(`  ${date}`)) {
        const values = line.split(/\s+/).filter((val: string) => val !== '');
        if (values.length >= 9) {
          const radiationData: IRadiationData = {
            CMF: parseValue(values[15]),
            cloud_Free_DNA_damage_UV_dose: parseValue(values[11]),
            cloud_Free_DNA_damage_UV_dose_error: parseValue(values[12]),
            cloud_Free_Erythemal_UV_dose: parseValue(values[3]),
            cloud_Free_Erythemal_UV_dose_error: parseValue(values[4]),
            cloud_Free_Erythemal_UV_index: parseValue(values[1]),
            cloud_Free_Erythemal_UV_index_error: parseValue(values[2]),
            cloud_Free_Vitamin_D_UV_dose: parseValue(values[7]),
            cloud_Free_Vitamin_D_UV_dose_error: parseValue(values[8]),
            cloud_Modified_DNA_damage_UV_dose: parseValue(values[13]),
            cloud_Modified_DNA_damage_UV_dose_error: parseValue(values[14]),
            cloud_Modified_Erythemal_UV_dose: parseValue(values[5]),
            cloud_Modified_Erythemal_UV_dose_error: parseValue(values[6]),
            cloud_Modified_Vitamin_D_UV_dose: parseValue(values[9]),
            cloud_Modified_Vitamin_D_UV_dose_error: parseValue(values[10]),
            date: values[0],
            ozone: parseValue(values[16]),
          };
          await this.cacheManager.set(cacheKey, radiationData, 3600000);
          return radiationData;
        }
      }
    }
    return undefined;
  }

  async getUVData(
    lat: number,
    lon: number,
  ): Promise<IRadiationData | undefined> {
    const closestStation: IStation | null = await this.getClosestStation(
      lat,
      lon,
    );

    if (!closestStation) {
      throw new Error(
        `no closest station for coordinates lat:${lat} lon:${lon}`,
      );
    }
    Logger.log('closestStation.url ', { url: closestStation.url });

    try {
      const response = await firstValueFrom(this.http.get(closestStation.url));
      const dt = DateTime.now();
      const data = response.data as string | undefined;
      Logger.log('UVData ', { data });
      return this.transform(data, dt.toFormat('yyyyMMdd'), closestStation.url);
    } catch (error) {
      Logger.error('Error fetching TEMIS data', error);
      return undefined;
    }
  }
}
