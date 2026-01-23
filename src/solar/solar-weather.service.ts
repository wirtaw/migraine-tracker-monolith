import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TemisClient } from './temis.client';
import { NoaaClient } from './noaa.client';
import { GfzClient } from './gfz.client';
import {
  IRadiationTodayData,
  IRadiationData,
  IKPIData,
  IGeophysicalWeatherData,
  NextWeather,
  IStation,
} from './interfaces/radiation.interface';
import { DateTime } from 'luxon';
import { UserService } from '../users/users.service';

@Injectable()
export class SolarWeatherService {
  constructor(
    private readonly temis: TemisClient,
    private readonly noaa: NoaaClient,
    private readonly gfz: GfzClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  async getRadiation(
    latitude: number,
    longitude: number,
    userId?: string,
  ): Promise<IRadiationTodayData[]> {
    const cacheKey = `solar_radiation_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const cached = await this.cacheManager.get<IRadiationTodayData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Parallel fetching for performance
    const [uvData, solarData, kpData] = await Promise.all([
      this.temis.getUVData(latitude, longitude),
      this.noaa.getSolarRadiation(),
      this.gfz.getKpIndex(),
    ]);

    const result: IRadiationTodayData[] = this.mergeData(
      uvData,
      solarData,
      kpData,
    );

    //Logger.log('getRadiation result ', { ...result });

    // 1 hour TTL (3600000 ms)
    await this.cacheManager.set(cacheKey, result, 3600000);

    if (userId) {
      void this.userService.trackSolarRequest(userId);
    }

    return result;
  }

  async getGeophysicalWeatherData(
    date: string,
    userId?: string,
  ): Promise<IGeophysicalWeatherData> {
    const result: IGeophysicalWeatherData =
      await this.noaa.getSolarRadiationByDate(date);
    const forecast: NextWeather | undefined =
      await this.noaa.getSolarRadiationForecast();
    if (forecast) {
      result.nextWeather = { ...forecast };
    }

    if (userId) {
      void this.userService.trackSolarRequest(userId);
    }

    return result;
  }

  private mergeData(
    uv: IRadiationData | undefined,
    solar: IGeophysicalWeatherData | undefined,
    kp: IKPIData | undefined,
  ): IRadiationTodayData[] {
    const today = new Date().toISOString().split('T')[0];

    return [
      {
        date: today,
        UVIndex: uv?.cloud_Free_Erythemal_UV_index || 0,
        ozone: uv?.ozone || 0,
        kpIndex: solar?.kIndex || 0,
        aRunning: solar?.aIndex || 0,
        Kp1: kp?.Kp1 || -1.0,
        Kp2: kp?.Kp2 || -1.0,
        Kp3: kp?.Kp3 || -1.0,
        Kp4: kp?.Kp4 || -1.0,
        Kp5: kp?.Kp5 || -1.0,
        Kp6: kp?.Kp6 || -1.0,
        Kp7: kp?.Kp7 || -1.0,
        Kp8: kp?.Kp8 || -1.0,
        ap1: kp?.ap1 || -1,
        ap2: kp?.ap2 || -1,
        ap3: kp?.ap3 || -1,
        ap4: kp?.ap4 || -1,
        ap5: kp?.ap5 || -1,
        ap6: kp?.ap6 || -1,
        ap7: kp?.ap7 || -1,
        ap8: kp?.ap8 || -1,
        solarFlux: kp?.solarFlux || 0,
        sunsPotNumber: kp?.sunsPotNumber || 0,
      },
    ];
  }

  async getClosestStation(lat: number, lon: number): Promise<IStation | null> {
    return this.temis.getClosestStation(lat, lon);
  }

  async getRadiationData(
    stationUrl: string,
    date: string,
    userId?: string,
  ): Promise<IRadiationData | undefined> {
    // Get station data
    const data = await this.temis.getStationData(stationUrl);

    if (userId) {
      void this.userService.trackSolarRequest(userId);
    }

    // Transform specifically for the date
    return this.temis.transform(data, date);
  }

  async getKpData(
    date: DateTime,
    userId?: string,
  ): Promise<IKPIData | undefined> {
    const data = await this.gfz.getKpData(date);

    if (userId) {
      void this.userService.trackSolarRequest(userId);
    }

    return data;
  }
}
