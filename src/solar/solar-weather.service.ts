import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TemisClient } from './temis.client';
import { NoaaClient } from './noaa.client';
import { GfzClient } from './gfz.client';
import { IRadiationTodayData } from './interfaces/radiation.interface';

@Injectable()
export class SolarWeatherService {
  constructor(
    private readonly temis: TemisClient,
    private readonly noaa: NoaaClient,
    private readonly gfz: GfzClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getRadiation(lat: number, lon: number): Promise<IRadiationTodayData[]> {
    const cacheKey = `solar_radiation_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = await this.cacheManager.get<IRadiationTodayData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Parallel fetching for performance
    const [uvData, solarData, kpData] = await Promise.all([
      this.temis.getUVData(lat, lon),
      this.noaa.getSolarRadiation(),
      this.gfz.getKpIndex(),
    ]);

    // Merge logic
    const result: IRadiationTodayData[] = this.mergeData(
      uvData,
      solarData,
      kpData,
    );

    // 1 hour TTL (3600000 ms)
    await this.cacheManager.set(cacheKey, result, 3600000);
    return result;
  }

  private mergeData(uv: any, solar: any, kp: any): IRadiationTodayData[] {
    // Logic to map date, UVIndex, ozone, etc.
    // Since we don't have the exact response structure, we'll create a dummy response
    // based on the inputs if they exist.

    const today = new Date().toISOString().split('T')[0];

    return [
      {
        date: today,
        UVIndex: uv?.uv_index || 0, // Placeholder mapping
        ozone: uv?.ozone || 0, // Placeholder mapping
        kpIndex: kp?.kp_index || 0, // Placeholder mapping
      },
    ];
  }
}
